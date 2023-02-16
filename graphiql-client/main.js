import fastify from "fastify";
import fastifyHttpProxy from "@fastify/http-proxy";
import fs from "fs";
import { z } from "zod";
import toml from "toml";

import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const appConfig = readConfiguration();

if (!appConfig) {
    process.exit(1);
}

const server = fastify({
    logger: true,
});

server.register(fastifyHttpProxy, {
    upstream: appConfig.proxy.url,
    prefix: "/graphql",
    http2: false,
});

server.get("/", function (_request, reply) {
    const stream = fs.createReadStream(__dirname + "/client.html");
    reply.type("text/html").send(stream);
});

server.listen({
    port: appConfig.server.port || 3005,
});

function readConfiguration() {
    try {
        const configContent = fs.readFileSync(__dirname + "/config.toml");
        var configData = toml.parse(configContent);

        var configSchema = z.object({
            server: z.object({
                port: z.number(),
            }),
            proxy: z.object({
                url: z.string().startsWith("https://"),
            }),
        });

        return configSchema.parse(configData);
    } catch (e) {
        console.error("failed to load configuration", e);
    }
    return null;
}
