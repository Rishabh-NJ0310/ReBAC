import { Request, Response } from "express";
import { authorizationService } from "../authorization/AuthorizationService.js";

export const setUser = async (req: Request, res: Response) => {
    try {
        const user = await authorizationService.createUser(req.body);
        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: (err as Error).message || "Internal Server Error" });
    }
};

export const setGroup = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const group = await authorizationService.createGroup(name);
        res.status(201).json(group);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: (err as Error).message || "Internal Server Error" });
    }
};

export const setResource = async (req: Request, res: Response) => {
    try {
        const resource = await authorizationService.createResource(req.body);
        res.status(201).json(resource);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: (err as Error).message || "Internal Server Error" });
    }
};

export const setObject = setResource;

export const setRelationship = async (req: Request, res: Response) => {
    try {
        const {
            relation,
            subjectSourceId,
            subjectTargetId,
            resourceSourceId,
            resourceTargetId,
            userSubjectId,
            resourceSubjectId,
            targetSubjectId,
            objectId,
            resourceId,
            subjectId
        } = req.body;

        if (!relation) {
            res.status(400).json({ message: "Missing required field: relation" });
            return;
        }

        const relationship = await authorizationService.createRelationship({
            relation,
            subjectSourceId: subjectSourceId ? Number(subjectSourceId) : undefined,
            subjectTargetId: subjectTargetId ? Number(subjectTargetId) : undefined,
            resourceSourceId: resourceSourceId ? Number(resourceSourceId) : undefined,
            resourceTargetId: resourceTargetId ? Number(resourceTargetId) : undefined,
            userSubjectId: userSubjectId ? Number(userSubjectId) : undefined,
            resourceSubjectId: resourceSubjectId ? Number(resourceSubjectId) : undefined,
            targetSubjectId: targetSubjectId ? Number(targetSubjectId) : undefined,
            objectId: objectId ? Number(objectId) : undefined,
            resourceId: resourceId ? Number(resourceId) : undefined,
            subjectId: subjectId ? Number(subjectId) : undefined
        });

        res.status(201).json(relationship);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: (err as Error).message || "Internal Server Error" });
    }
};

export const check = async (req: Request, res: Response) => {
    try {
        const userId = req.body?.userId ?? req.query.userId ?? req.query.subjectId;
        const resourceId = req.body?.resourceId ?? req.query.resourceId ?? req.query.objectId;
        const permission = (req.body?.permission ?? req.query.permission ?? req.query.relation) as string;
        const tenantId = (req.body?.tenantId ?? req.query.tenantId) as string | undefined;

        let attributes = req.body?.attributes;
        if (!attributes && req.query.attributes) {
            try {
                attributes = typeof req.query.attributes === "string" ? JSON.parse(req.query.attributes) : req.query.attributes;
            } catch { /* proceed */ }
        }

        if (!userId || !resourceId || !permission) {
            res.status(400).json({
                message: "Missing required query or body parameters: userId, resourceId, and permission."
            });
            return;
        }

        const result = await authorizationService.checkPermission({
            userId: Number(userId),
            resourceId: Number(resourceId),
            permission,
            tenantId,
            attributes
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: (err as Error).message || "Internal Server Error" });
    }
};

export const getGraphData = async (req: Request, res: Response) => {
    try {
        const graphData = await authorizationService.getGraphData();
        res.json(graphData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await authorizationService.getUsers();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getResources = async (req: Request, res: Response) => {
    try {
        const resources = await authorizationService.getResources();
        res.json(resources);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getRelationships = async (req: Request, res: Response) => {
    try {
        const relationships = await authorizationService.getRelationships();
        res.json(relationships);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const allThreeTables = async (req: Request, res: Response) => {
    try {
        const users = await authorizationService.getUsers();
        const resources = await authorizationService.getResources();
        const relationships = await authorizationService.getRelationships();
        res.json({ users, resources, relationships });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const deleteRelationship = async (req: Request, res: Response) => {
    try {
        const { id } = req.query;
        if (!id) {
            res.status(400).json({ message: "Missing required query parameter: id" });
            return;
        }
        const result = await authorizationService.deleteRelationship(Number(id));
        res.json({ message: "Relationship deleted successfully", result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const deleteAll = async (req: Request, res: Response) => {
    try {
        await authorizationService.deleteAll();
        res.json({ message: "All data deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getGraphView = (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-950 text-slate-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReBAC Engine V3.4 Enterprise Visualizer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        code, pre { font-family: 'Fira Code', monospace; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #090d16; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
    </style>
</head>
<body class="h-full flex flex-col overflow-hidden">
    <!-- Header -->
    <header class="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div class="flex items-center space-x-3">
            <div class="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/20">
                ◭
            </div>
            <div>
                <div class="flex items-center space-x-2">
                    <h1 class="text-lg font-bold text-white tracking-tight">ReBAC Engine V3.4</h1>
                    <span class="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">ENTERPRISE</span>
                </div>
                <p class="text-xs text-slate-400">Identity Graph + ReBAC + ABAC + Caveats + Explain Tree Visualizer</p>
            </div>
        </div>
        <div class="flex items-center space-x-3">
            <button onclick="loadGraph()" class="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all">
                ↻ Refresh Graph
            </button>
            <button onclick="resetDb()" class="px-3.5 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/30 rounded-lg text-xs font-semibold transition-all">
                🗑 Reset DB
            </button>
        </div>
    </header>

    <!-- Main Workspace -->
    <main class="flex-1 flex overflow-hidden">
        <!-- Left Sidebar: Forms & Edges -->
        <section class="w-80 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto flex flex-col gap-4 shrink-0">
            <!-- Add User Form -->
            <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
                <h2 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span> Add User (Identity Node)
                </h2>
                <form onsubmit="addUser(event)" class="flex flex-col gap-2">
                    <input type="text" placeholder="Name (e.g. Raj)" required class="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <input type="email" placeholder="Email" required class="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <input type="password" placeholder="Password" value="pass" required class="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white font-medium py-1.5 rounded-lg text-xs transition-all shadow-sm">Create User</button>
                </form>
            </div>

            <!-- Add Group Form (V3.0 Identity Node) -->
            <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
                <h2 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-purple-500"></span> Add Group (Identity Node)
                </h2>
                <form onsubmit="addGroup(event)" class="flex flex-col gap-2">
                    <input type="text" placeholder="Group Name (e.g. Doctors)" required class="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500">
                    <button type="submit" class="bg-purple-600 hover:bg-purple-500 text-white font-medium py-1.5 rounded-lg text-xs transition-all shadow-sm">Create Group</button>
                </form>
            </div>

            <!-- Add Resource Form -->
            <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
                <h2 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-pink-500"></span> Add Resource Node
                </h2>
                <form onsubmit="addResource(event)" class="flex flex-col gap-2">
                    <div class="flex gap-2">
                        <select id="resType" class="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500">
                            <option value="patient">patient</option>
                            <option value="ward">ward</option>
                            <option value="department">department</option>
                        </select>
                        <input type="text" id="resName" placeholder="Name (e.g. Patient101)" required class="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500">
                    </div>
                    <button type="submit" class="bg-pink-600 hover:bg-pink-500 text-white font-medium py-1.5 rounded-lg text-xs transition-all shadow-sm">Create Resource</button>
                </form>
            </div>

            <!-- Three-Graph Edge Form -->
            <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
                <h2 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Add Graph Edge</span>
                    <span class="text-[10px] text-slate-500 font-normal">V3 Three-Graph</span>
                </h2>
                <form onsubmit="addEdge(event)" class="flex flex-col gap-2">
                    <div>
                        <label class="text-[10px] text-slate-400 font-semibold mb-1 block">Graph Edge Type</label>
                        <select id="edgeMode" onchange="updateEdgeFormFields()" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 font-medium">
                            <option value="permission">1. Permission Edge (Subject ➔ Resource)</option>
                            <option value="identity">2. Identity Edge (Subject ➔ Subject)</option>
                            <option value="resource">3. Resource Edge (Resource ➔ Resource)</option>
                        </select>
                    </div>

                    <!-- Dynamic Selectors -->
                    <div>
                        <label id="sourceLabel" class="text-[10px] text-slate-400 font-semibold mb-1 block">Source Subject</label>
                        <select id="edgeSourceSelect" required class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                        </select>
                    </div>

                    <div>
                        <label class="text-[10px] text-slate-400 font-semibold mb-1 block">Relation</label>
                        <input type="text" id="edgeRelationInput" placeholder="Relation (e.g. doctor_of, member, contains)" required class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500">
                    </div>

                    <div>
                        <label id="targetLabel" class="text-[10px] text-slate-400 font-semibold mb-1 block">Target Resource</label>
                        <select id="edgeTargetSelect" required class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                        </select>
                    </div>

                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-1.5 rounded-lg text-xs transition-all shadow-sm">Add Graph Edge</button>
                </form>
            </div>
        </section>

        <!-- Center Canvas -->
        <section class="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
            <!-- Legend overlay -->
            <div class="absolute top-3 left-3 z-10 flex flex-wrap gap-3 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 border border-slate-800 rounded-xl shadow-md">
                <div class="flex items-center space-x-1.5 text-xs"><span class="w-3 h-3 rounded-full bg-blue-500"></span><span class="text-slate-300">User</span></div>
                <div class="flex items-center space-x-1.5 text-xs"><span class="w-3 h-3 rounded-full bg-purple-500"></span><span class="text-slate-300">Group</span></div>
                <div class="flex items-center space-x-1.5 text-xs"><span class="w-3 h-3 rounded-full bg-pink-500"></span><span class="text-slate-300">Patient</span></div>
                <div class="flex items-center space-x-1.5 text-xs"><span class="w-3 h-3 rounded-full bg-indigo-500"></span><span class="text-slate-300">Ward</span></div>
                <div class="flex items-center space-x-1.5 text-xs"><span class="w-3 h-3 rounded-full bg-amber-500"></span><span class="text-slate-300">Department</span></div>
            </div>
            <div id="mynetwork" class="flex-1 w-full h-full"></div>
        </section>

        <!-- Right Sidebar: Evaluation, Trace & Explain Tree -->
        <section class="w-96 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto flex flex-col gap-4 shrink-0">
            <!-- Access Check Form (V3.4 Enhanced) -->
            <div class="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 shadow-sm">
                <h2 class="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Permission Check (V3.4 Engine)</span>
                    <span class="text-[10px] text-slate-500">ReBAC + ABAC + Caveats</span>
                </h2>
                <form onsubmit="runCheck(event)" class="flex flex-col gap-2">
                    <div>
                        <label class="text-[10px] text-slate-400 font-semibold mb-0.5 block">User (Subject)</label>
                        <select id="checkUserSelect" required class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                        </select>
                    </div>

                    <div>
                        <label class="text-[10px] text-slate-400 font-semibold mb-0.5 block">Target Resource</label>
                        <select id="checkResourceSelect" required class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500">
                        </select>
                    </div>

                    <div class="flex gap-2">
                        <div class="flex-1">
                            <label class="text-[10px] text-slate-400 font-semibold mb-0.5 block">Permission</label>
                            <input type="text" id="checkPermissionInput" value="view" required class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500">
                        </div>
                        <div class="w-28">
                            <label class="text-[10px] text-slate-400 font-semibold mb-0.5 block">Tenant ID</label>
                            <input type="text" id="checkTenantInput" placeholder="default" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-indigo-300 focus:outline-none focus:border-emerald-500">
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-0.5">
                            <label class="text-[10px] text-slate-400 font-semibold block">Runtime Attributes (ABAC / Caveats JSON)</label>
                            <button type="button" onclick="loadSampleAttributes()" class="text-[9px] text-indigo-400 hover:underline">Sample</button>
                        </div>
                        <textarea id="checkAttributesInput" rows="2" placeholder='{ "shift_active": true, "patient": { "status": "READY" } }' class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-emerald-500"></textarea>
                    </div>

                    <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-xs transition-all shadow-md mt-1">
                        Evaluate & Generate Explain Tree
                    </button>
                </form>
            </div>

            <!-- Explain Tree & Profiler Dashboard -->
            <div class="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-3.5 min-h-[360px] overflow-hidden">
                <div class="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/80 shrink-0">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <span>Explain Tree Trace</span>
                    </h3>
                    <span id="verdictBadge" class="hidden px-2.5 py-0.5 rounded text-[11px] font-bold"></span>
                </div>

                <!-- Profiler stats header bar -->
                <div id="profilerBar" class="hidden grid grid-cols-4 gap-1.5 mb-2 pb-2 border-b border-slate-800/80 text-[10px] text-slate-400 shrink-0">
                    <div class="bg-slate-900 p-1.5 rounded border border-slate-800 text-center"><span class="block text-slate-500 text-[9px]">TIME</span><span id="profTime" class="font-bold text-slate-200"></span></div>
                    <div class="bg-slate-900 p-1.5 rounded border border-slate-800 text-center"><span class="block text-slate-500 text-[9px]">DB LOOKUPS</span><span id="profLookups" class="font-bold text-slate-200"></span></div>
                    <div class="bg-slate-900 p-1.5 rounded border border-slate-800 text-center"><span class="block text-slate-500 text-[9px]">DEPTH</span><span id="profDepth" class="font-bold text-slate-200"></span></div>
                    <div class="bg-slate-900 p-1.5 rounded border border-slate-800 text-center"><span class="block text-slate-500 text-[9px]">MEMO HITS</span><span id="profMemo" class="font-bold text-slate-200"></span></div>
                </div>

                <!-- Live Explain Tree Output Area -->
                <div id="explainOutput" class="flex-1 overflow-y-auto font-mono text-[11px] text-slate-300 pr-1 leading-relaxed">
                    <div class="text-xs text-slate-500 italic text-center py-12">
                        Run a permission check to render the live Explain Tree decision trace
                    </div>
                </div>
            </div>
        </section>
    </main>

    <!-- Client Script -->
    <script>
        let network = null;
        let allNodes = [];
        let allEdges = [];

        window.addEventListener('DOMContentLoaded', () => {
            loadGraph();
        });

        function loadSampleAttributes() {
            document.getElementById('checkAttributesInput').value = JSON.stringify({
                shift_active: true,
                patient: { status: "READY" },
                user: { department: "ICU" }
            }, null, 2);
        }

        async function loadGraph() {
            try {
                const res = await fetch('/api/v3/graph');
                const data = await res.json();
                allNodes = data.nodes;
                allEdges = data.edges;

                populateSelects(data.nodes);

                const visNodes = data.nodes.map(n => {
                    let color = '#6366f1';
                    let shape = 'box';

                    if (n.type === 'user') { color = '#3b82f6'; shape = 'dot'; }
                    else if (n.type === 'group') { color = '#a855f7'; shape = 'hexagon'; }
                    else if (n.type === 'patient') { color = '#ec4899'; shape = 'diamond'; }
                    else if (n.type === 'ward') { color = '#6366f1'; shape = 'triangle'; }
                    else if (n.type === 'department') { color = '#eab308'; shape = 'star'; }

                    return {
                        id: n.id,
                        label: n.label,
                        shape: shape,
                        color: { background: color, border: color, highlight: { background: '#ffffff', border: '#6366f1' } },
                        font: { color: '#ffffff', face: 'Inter', size: 12 },
                        shadow: { enabled: true, color: 'rgba(0,0,0,0.4)' },
                        size: (n.type === 'user' || n.type === 'group') ? 22 : 18
                    };
                });

                const visEdges = data.edges.map(e => ({
                    id: e.id,
                    from: e.source,
                    to: e.target,
                    label: e.label,
                    arrows: 'to',
                    color: { color: '#475569', highlight: '#818cf8' },
                    font: { color: '#94a3b8', background: '#090d16', size: 10, face: 'Fira Code' },
                    width: 1.5
                }));

                const container = document.getElementById('mynetwork');
                network = new vis.Network(container, {
                    nodes: new vis.DataSet(visNodes),
                    edges: new vis.DataSet(visEdges)
                }, {
                    physics: { barnesHut: { gravitationalConstant: -2500, centralGravity: 0.3, springLength: 140 } }
                });

            } catch (err) { console.error("Error loading graph:", err); }
        }

        function populateSelects(nodes) {
            const edgeSourceSelect = document.getElementById('edgeSourceSelect');
            const edgeTargetSelect = document.getElementById('edgeTargetSelect');
            const checkUserSelect = document.getElementById('checkUserSelect');
            const checkResourceSelect = document.getElementById('checkResourceSelect');

            updateEdgeFormFields();

            checkUserSelect.innerHTML = '<option value="">Select User...</option>';
            checkResourceSelect.innerHTML = '<option value="">Select Resource...</option>';

            nodes.forEach(n => {
                const opt = document.createElement('option');
                opt.value = n.id.split(':')[1];
                opt.textContent = n.label;

                if (n.type === 'user') {
                    checkUserSelect.appendChild(opt.cloneNode(true));
                } else if (n.type !== 'group') {
                    checkResourceSelect.appendChild(opt.cloneNode(true));
                }
            });
        }

        function updateEdgeFormFields() {
            const mode = document.getElementById('edgeMode').value;
            const edgeSourceSelect = document.getElementById('edgeSourceSelect');
            const edgeTargetSelect = document.getElementById('edgeTargetSelect');
            const sourceLabel = document.getElementById('sourceLabel');
            const targetLabel = document.getElementById('targetLabel');

            edgeSourceSelect.innerHTML = '';
            edgeTargetSelect.innerHTML = '';

            if (mode === 'permission') {
                sourceLabel.textContent = 'Subject (User or Group)';
                targetLabel.textContent = 'Target Resource';
                allNodes.filter(n => n.type === 'user' || n.type === 'group').forEach(n => {
                    const opt = document.createElement('option');
                    opt.value = n.subjectId;
                    opt.textContent = n.label;
                    edgeSourceSelect.appendChild(opt);
                });
                allNodes.filter(n => n.type !== 'user' && n.type !== 'group').forEach(n => {
                    const opt = document.createElement('option');
                    opt.value = n.id.split(':')[1];
                    opt.textContent = n.label;
                    edgeTargetSelect.appendChild(opt);
                });
            } else if (mode === 'identity') {
                sourceLabel.textContent = 'Source Subject (User or Group)';
                targetLabel.textContent = 'Target Group';
                allNodes.filter(n => n.type === 'user' || n.type === 'group').forEach(n => {
                    const opt = document.createElement('option');
                    opt.value = n.subjectId;
                    opt.textContent = n.label;
                    edgeSourceSelect.appendChild(opt);
                });
                allNodes.filter(n => n.type === 'group').forEach(n => {
                    const opt = document.createElement('option');
                    opt.value = n.subjectId;
                    opt.textContent = n.label;
                    edgeTargetSelect.appendChild(opt);
                });
            } else if (mode === 'resource') {
                sourceLabel.textContent = 'Source Resource (Container)';
                targetLabel.textContent = 'Target Resource (Contained)';
                allNodes.filter(n => n.type !== 'user' && n.type !== 'group').forEach(n => {
                    const opt = document.createElement('option');
                    opt.value = n.id.split(':')[1];
                    opt.textContent = n.label;
                    edgeSourceSelect.appendChild(opt.cloneNode(true));
                    edgeTargetSelect.appendChild(opt.cloneNode(true));
                });
            }
        }

        async function addUser(e) {
            e.preventDefault();
            const inputs = e.target.querySelectorAll('input');
            const res = await fetch('/api/v3/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: inputs[0].value, email: inputs[1].value, password: inputs[2].value })
            });
            if (res.ok) { e.target.reset(); loadGraph(); }
            else { alert("Failed to create user."); }
        }

        async function addGroup(e) {
            e.preventDefault();
            const name = e.target.querySelector('input').value;
            const res = await fetch('/api/v3/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (res.ok) { e.target.reset(); loadGraph(); }
            else { alert("Failed to create group."); }
        }

        async function addResource(e) {
            e.preventDefault();
            const type = document.getElementById('resType').value;
            const name = document.getElementById('resName').value;
            const res = await fetch('/api/v3/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, name })
            });
            if (res.ok) { document.getElementById('resName').value = ''; loadGraph(); }
            else { alert("Failed to create resource."); }
        }

        async function addEdge(e) {
            e.preventDefault();
            const mode = document.getElementById('edgeMode').value;
            const sourceVal = Number(document.getElementById('edgeSourceSelect').value);
            const targetVal = Number(document.getElementById('edgeTargetSelect').value);
            const relation = document.getElementById('edgeRelationInput').value;

            const body = { relation };

            if (mode === 'identity') {
                body.subjectSourceId = sourceVal;
                body.subjectTargetId = targetVal;
            } else if (mode === 'resource') {
                body.resourceSourceId = sourceVal;
                body.resourceTargetId = targetVal;
            } else if (mode === 'permission') {
                body.subjectId = sourceVal;
                body.resourceId = targetVal;
            }

            const res = await fetch('/api/v3/relationships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) { document.getElementById('edgeRelationInput').value = ''; loadGraph(); }
            else {
                const errData = await res.json();
                alert("Failed to create edge: " + (errData.message || "Unknown error"));
            }
        }

        async function resetDb() {
            if (confirm("Reset database (deletes all Users, Groups, Resources & Edges)?")) {
                const res = await fetch('/api/v3/deleteAll', { method: 'POST' });
                if (res.ok) {
                    loadGraph();
                    document.getElementById('explainOutput').innerHTML = '<div class="text-xs text-slate-500 italic text-center py-12">Run a permission check to render the live Explain Tree decision trace</div>';
                    document.getElementById('verdictBadge').classList.add('hidden');
                    document.getElementById('profilerBar').classList.add('hidden');
                }
            }
        }

        async function runCheck(e) {
            e.preventDefault();
            const userId = document.getElementById('checkUserSelect').value;
            const resourceId = document.getElementById('checkResourceSelect').value;
            const permission = document.getElementById('checkPermissionInput').value;
            const tenantId = document.getElementById('checkTenantInput').value;
            const attrText = document.getElementById('checkAttributesInput').value;

            let attributes;
            if (attrText.trim()) {
                try { attributes = JSON.parse(attrText); }
                catch (err) { alert("Invalid JSON in Runtime Attributes field."); return; }
            }

            const explainOutput = document.getElementById('explainOutput');
            const badge = document.getElementById('verdictBadge');
            const profBar = document.getElementById('profilerBar');

            explainOutput.innerHTML = '<div class="text-xs text-slate-400 animate-pulse text-center py-10">Evaluating rules & generating Explain Tree...</div>';
            badge.className = "px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400";
            badge.textContent = "EVALUATING";
            badge.classList.remove('hidden');

            try {
                const res = await fetch('/api/v3/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: Number(userId), resourceId: Number(resourceId), permission, tenantId, attributes })
                });

                const data = await res.json();

                // 1. Update Verdict Badge
                badge.className = data.allowed
                    ? "px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30";
                badge.textContent = data.allowed ? "ALLOW" : "DENY";

                // 2. Update Profiler Metrics Bar
                if (data.profile) {
                    document.getElementById('profTime').textContent = data.profile.totalTimeMs + 'ms';
                    document.getElementById('profLookups').textContent = data.profile.dbLookups;
                    document.getElementById('profDepth').textContent = data.profile.maxRecursionDepth;
                    document.getElementById('profMemo').textContent = data.profile.memoHits;
                    profBar.classList.remove('hidden');
                }

                // 3. Render Explain Tree ASCII
                explainOutput.innerHTML = '';
                const pre = document.createElement('pre');
                pre.className = "text-[11px] leading-relaxed overflow-x-auto p-2 bg-slate-900/90 rounded border border-slate-800 text-slate-200";
                pre.textContent = data.explainText || (data.trace ? JSON.stringify(data.trace, null, 2) : "No tree output");
                explainOutput.appendChild(pre);

                // Highlight path in network
                if (data.trace && data.trace.length > 0) {
                    data.trace.forEach(t => {
                        const color = t.result ? '#22c55e' : '#ef4444';
                        try {
                            network.body.data.nodes.update({ id: 'resource:' + t.resourceId, color: { background: color, border: color } });
                        } catch { }
                    });
                }

            } catch (err) {
                console.error(err);
                explainOutput.innerHTML = '<div class="text-xs text-rose-400 p-4">Evaluation Error</div>';
            }
        }
    </script>
</body>
</html>
`);
};