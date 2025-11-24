import json
import multiprocessing
from mcstatus import JavaServer
import subprocess

def getServers():
    with open("../servers.json", 'r') as f:
        jsonData = json.load(f)

    serverInfo = []
    temp1 = []
    with multiprocessing.Pool(processes=len(jsonData.get("servers"))) as pool:
        results = pool.map(pingServer, range(10))
    return results

async def pingServer(host, port):
    try:
        raw = (await JavaServer.lookup("{host}:{port}"))
        return [await raw.motd.to_plain(), raw.players.online, raw.players.max]
    except:
        ""

serverData = getServers()

print(serverData)
