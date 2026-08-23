export function createPuppeteerConfig(options = {}) {
  const platform = options.platform ?? process.platform;
  const ci = options.ci ?? process.env.CI;

  if (platform === "linux" && ci === "true") {
    return Object.freeze({
      args: Object.freeze(["--no-sandbox"]),
    });
  }

  return Object.freeze({});
}
