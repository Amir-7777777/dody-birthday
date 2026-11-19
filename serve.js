/* Tiny zero-dependency local server: node serve.js */
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT) || 4173;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".mp4": "audio/mp4",
  ".m4a": "audio/mp4",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8"
};

http.createServer((req, res) => {
  const requestPath = decodeURIComponent((req.url || "/").split("?")[0]);
  let filePath = path.join(root, requestPath === "/" ? "index.html" : requestPath);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.stat(filePath, (statError, stat) => {
    if (!statError && stat.isDirectory()) filePath = path.join(filePath, "index.html");
    fs.stat(filePath, (error, info) => {
      if (error || !info.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }
      const type = mime[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      const headers = {
        "Content-Type": type,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff"
      };
      if (req.method === "HEAD") {
        headers["Content-Length"] = info.size;
        res.writeHead(200, headers);
        res.end();
        return;
      }
      // Range requests keep audio/video seeking fast and reliable.
      const range = req.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(String(range).trim());
        if (match) {
          let start = match[1] === "" ? null : Number(match[1]);
          let end = match[2] === "" ? null : Number(match[2]);
          if (start === null && end !== null) {
            start = Math.max(info.size - end, 0);
            end = info.size - 1;
          } else if (start !== null && end === null) {
            end = info.size - 1;
          }
          if (start !== null && end !== null && start <= end && start < info.size) {
            end = Math.min(end, info.size - 1);
            res.writeHead(206, {
              ...headers,
              "Content-Range": `bytes ${start}-${end}/${info.size}`,
              "Content-Length": end - start + 1
            });
            fs.createReadStream(filePath, { start, end }).pipe(res);
            return;
          }
          res.writeHead(416, { "Content-Range": `bytes */${info.size}` });
          res.end();
          return;
        }
      }
      headers["Content-Length"] = info.size;
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    });
  });
}).listen(port, () => {
  console.log(`Dody's birthday is ready at http://localhost:${port}`);
});
