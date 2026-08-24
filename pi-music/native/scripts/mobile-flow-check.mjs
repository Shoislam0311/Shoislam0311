const targets = await fetch("http://127.0.0.1:9223/json").then((response) => response.json());
const page = targets.find((target) => target.type === "page" && target.url.includes("localhost:1420"));

if (!page) throw new Error("Pi-Music preview target was not found on the DevTools endpoint.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let sequence = 0;

const ready = new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  const resolve = pending.get(message.id);
  if (!resolve) return;
  pending.delete(message.id);
  if (message.error) resolve(Promise.reject(new Error(message.error.message)));
  else resolve(message.result);
});

const command = (method, params = {}) => new Promise((resolve) => {
  const id = ++sequence;
  pending.set(id, resolve);
  socket.send(JSON.stringify({ id, method, params }));
});

const evaluate = async (expression) => {
  const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};

await ready;
await command("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
  screenWidth: 390,
  screenHeight: 844,
});
await command("Page.enable");
await evaluate("document.fonts.ready");

const clickAndInspect = async (label, expectedHeading) => {
  await evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((candidate) => candidate.innerText.trim() === ${JSON.stringify(label)});
    if (!button) throw new Error('Could not find native navigation button: ' + ${JSON.stringify(label)});
    button.click();
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 80));
  return evaluate(`(() => {
    const text = document.body.innerText;
    const dock = document.querySelector('.listening-islands');
    const player = document.querySelector('.orbit-player');
    const dockStyle = getComputedStyle(dock);
    const playerStyle = getComputedStyle(player);
    const dockBox = dock.getBoundingClientRect();
    const playerBox = player.getBoundingClientRect();
    return {
      destination: ${JSON.stringify(label)},
      headingFound: text.includes(${JSON.stringify(expectedHeading)}),
      dockPosition: dockStyle.position,
      playerPosition: playerStyle.position,
      dockWithinViewport: dockBox.top >= 0 && dockBox.bottom <= innerHeight,
      playerWithinViewport: playerBox.top >= 0 && playerBox.bottom <= innerHeight,
      viewport: { width: innerWidth, height: innerHeight },
    };
  })()`);
};

const results = [];
results.push(await clickAndInspect("Listen", "tiny tracks,"));
results.push(await clickAndInspect("Library", "found things,"));
results.push(await clickAndInspect("Patch Bay", "every route"));
results.push(await clickAndInspect("Saved", "the ones"));

socket.close();
console.log(JSON.stringify(results, null, 2));
