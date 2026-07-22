import { Request, Response } from "express";
import { authorizationService } from "../authorization/AuthorizationService.js";

export const setUser = async (req: Request, res: Response) => {
    try {
        const user = await authorizationService.createUser(req.body);
        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const setResource = async (req: Request, res: Response) => {
    try {
        const resource = await authorizationService.createResource(req.body);
        res.status(201).json(resource);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const setObject = setResource;

export const setRelationship = async (req: Request, res: Response) => {
    try {
        const { relation, userSubjectId, subjectId, resourceSubjectId, objectId, resourceId } = req.body;
        const targetResourceId = objectId ?? resourceId;
        const actualUserSubjectId = userSubjectId ?? (resourceSubjectId ? undefined : subjectId);

        if (!relation || (!actualUserSubjectId && !resourceSubjectId) || !targetResourceId) {
            res.status(400).json({
                message: "Missing required fields. Provide relation, objectId/resourceId, and either userSubjectId/subjectId or resourceSubjectId."
            });
            return;
        }

        const relationship = await authorizationService.createRelationship({
            relation,
            userSubjectId: actualUserSubjectId ? Number(actualUserSubjectId) : undefined,
            resourceSubjectId: resourceSubjectId ? Number(resourceSubjectId) : undefined,
            objectId: Number(targetResourceId)
        });

        res.status(201).json(relationship);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const check = async (req: Request, res: Response) => {
    try {
        const { userId, subjectId, resourceId, objectId, permission, relation } = req.query;
        const actualUserId = userId ?? subjectId;
        const actualResourceId = resourceId ?? objectId;
        const actualPermission = (permission ?? relation) as string;

        if (!actualUserId || !actualResourceId || !actualPermission) {
            res.status(400).json({
                message: "Missing required query parameters: userId (or subjectId), resourceId (or objectId), and permission (or relation)."
            });
            return;
        }

        const result = await authorizationService.checkPermission({
            userId: Number(actualUserId),
            resourceId: Number(actualResourceId),
            permission: actualPermission
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
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
    <title>ReBAC Relationship Graph Visualizer V3</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Outfit', sans-serif;
        }
        /* Custom scrollbars */
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #0f172a;
        }
        ::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #475569;
        }
    </style>
</head>
<body class="h-full flex flex-col overflow-hidden">
    <!-- Top Header -->
    <header class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-indigo-500/30">
                ◭
            </div>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-white">ReBAC Engine V3</h1>
                <p class="text-xs text-slate-400">DFS Rule Engine & Graph Visualization Client</p>
            </div>
        </div>
        <div class="flex items-center space-x-3">
            <button onclick="loadGraph()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors">
                Refresh Graph
            </button>
            <button onclick="resetDb()" class="px-4 py-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/30 rounded-lg text-sm font-medium transition-colors">
                Reset DB
            </button>
        </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 flex overflow-hidden">
        <!-- Sidebar: Form Controls (Col 1) -->
        <section class="w-80 bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto flex flex-col gap-6 shrink-0">
            <!-- Add User -->
            <div class="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                <h2 class="text-sm font-semibold text-white mb-3">Add User</h2>
                <form id="addUserForm" class="flex flex-col gap-2.5" onsubmit="addUser(event)">
                    <input type="text" placeholder="Name" required class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-white">
                    <input type="email" placeholder="Email" required class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-white">
                    <input type="password" placeholder="Password" required class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-white">
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-1.5 rounded-lg text-sm transition-colors">Create User</button>
                </form>
            </div>

            <!-- Add Resource -->
            <div class="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                <h2 class="text-sm font-semibold text-white mb-3">Add Resource</h2>
                <form id="addResourceForm" class="flex flex-col gap-2.5" onsubmit="addResource(event)">
                    <select required class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-300">
                        <option value="patient">Patient</option>
                        <option value="ward">Ward</option>
                        <option value="department">Department</option>
                    </select>
                    <input type="text" placeholder="Resource Name" required class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-white">
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-1.5 rounded-lg text-sm transition-colors">Create Resource</button>
                </form>
            </div>

            <!-- Add Relationship -->
            <div class="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                <h2 class="text-sm font-semibold text-white mb-3">Add Relationship</h2>
                <form id="addRelationForm" class="flex flex-col gap-2.5" onsubmit="addRelationship(event)">
                    <!-- Subject selection (User or Resource) -->
                    <div class="flex gap-2">
                        <select id="subjectType" onchange="toggleSubjectDropdowns()" class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-300">
                            <option value="user">User</option>
                            <option value="resource">Resource</option>
                        </select>
                        <select id="userSubjectSelect" class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-300">
                            <option value="">Select User...</option>
                        </select>
                        <select id="resourceSubjectSelect" class="hidden flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-300">
                            <option value="">Select Resource...</option>
                        </select>
                    </div>

                    <!-- Relation -->
                    <input type="text" id="relationInput" placeholder="Relation (e.g., doctor_of, contains)" required class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-white">

                    <!-- Target Resource -->
                    <select id="targetSelect" required class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-300">
                        <option value="">Select Target Resource...</option>
                    </select>

                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-1.5 rounded-lg text-sm transition-colors">Create Relation</button>
                </form>
            </div>
        </section>

        <!-- Access Checker & Trace (Col 2) -->
        <section class="w-96 bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto flex flex-col gap-6 shrink-0">
            <!-- Access Checker -->
            <div class="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
                <h2 class="text-sm font-semibold text-white mb-3">Access Evaluation</h2>
                <form id="checkForm" class="flex flex-col gap-2.5" onsubmit="checkPermission(event)">
                    <select id="checkUserSelect" required class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-300">
                        <option value="">Select User...</option>
                    </select>
                    <select id="checkTargetSelect" required class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-slate-300">
                        <option value="">Select Target...</option>
                    </select>
                    <input type="text" id="checkPermissionInput" placeholder="Permission (e.g., view)" value="view" required class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 text-white">
                    <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
                        Evaluate & Run Trace
                    </button>
                </form>
            </div>

            <!-- DFS Trace Visualization logs -->
            <div class="flex-1 flex flex-col bg-slate-950 border border-slate-850 rounded-xl p-4 min-h-[300px] overflow-hidden">
                <h3 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 shrink-0 flex items-center justify-between">
                    <span>DFS Execution Trace</span>
                    <span id="traceStatusBadge" class="hidden px-2 py-0.5 rounded text-[10px] font-bold"></span>
                </h3>
                <div id="traceLog" class="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                    <div class="text-xs text-slate-500 italic text-center py-8">
                        Run a permission check to view the live evaluation path
                    </div>
                </div>
            </div>
        </section>

        <!-- Canvas Area (Col 3) -->
        <section class="flex-1 bg-slate-950 relative overflow-hidden flex flex-col">
            <div class="absolute top-4 left-4 z-10 flex gap-4 bg-slate-900/80 backdrop-blur-md px-4 py-2 border border-slate-800 rounded-xl shadow-lg">
                <div class="flex items-center space-x-2 text-xs">
                    <span class="w-3.5 h-3.5 rounded-full bg-blue-500 inline-block border border-blue-400"></span>
                    <span class="text-slate-300">User</span>
                </div>
                <div class="flex items-center space-x-2 text-xs">
                    <span class="w-3.5 h-3.5 rounded-full bg-pink-500 inline-block border border-pink-400"></span>
                    <span class="text-slate-300">Patient</span>
                </div>
                <div class="flex items-center space-x-2 text-xs">
                    <span class="w-3.5 h-3.5 rounded-full bg-purple-500 inline-block border border-purple-400"></span>
                    <span class="text-slate-300">Ward</span>
                </div>
                <div class="flex items-center space-x-2 text-xs">
                    <span class="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block border border-amber-400"></span>
                    <span class="text-slate-300">Department</span>
                </div>
            </div>
            <!-- Interactive visual canvas -->
            <div id="mynetwork" class="flex-1 w-full h-full"></div>
        </section>
    </main>

    <!-- Client logic -->
    <script>
        let network = null;
        let graphNodes = [];
        let graphEdges = [];
        let rawNodes = [];
        let rawEdges = [];

        // Initialization
        window.addEventListener('DOMContentLoaded', () => {
            loadGraph();
        });

        function toggleSubjectDropdowns() {
            const subjectType = document.getElementById('subjectType').value;
            if (subjectType === 'user') {
                document.getElementById('userSubjectSelect').classList.remove('hidden');
                document.getElementById('resourceSubjectSelect').classList.add('hidden');
                document.getElementById('userSubjectSelect').required = true;
                document.getElementById('resourceSubjectSelect').required = false;
            } else {
                document.getElementById('userSubjectSelect').classList.add('hidden');
                document.getElementById('resourceSubjectSelect').classList.remove('hidden');
                document.getElementById('userSubjectSelect').required = false;
                document.getElementById('resourceSubjectSelect').required = true;
            }
        }

        async function loadGraph() {
            try {
                // Fetch graph data
                const response = await fetch('/api/v2.1/graph');
                const data = await response.json();
                rawNodes = data.nodes;
                rawEdges = data.edges;

                // Populate forms dropdowns
                populateDropdowns(data.nodes);

                // Build Vis.js Nodes
                graphNodes = data.nodes.map(n => {
                    let color = '#6366f1'; // default indigo
                    let shape = 'box';
                    let fontColor = '#ffffff';

                    if (n.type === 'user') {
                        color = '#3b82f6'; // blue
                        shape = 'dot';
                    } else if (n.type === 'patient') {
                        color = '#ec4899'; // pink
                        shape = 'diamond';
                    } else if (n.type === 'ward') {
                        color = '#a855f7'; // purple
                        shape = 'triangle';
                    } else if (n.type === 'department') {
                        color = '#eab308'; // amber
                        shape = 'star';
                    }

                    return {
                        id: n.id,
                        label: n.label,
                        shape: shape,
                        color: {
                            background: color,
                            border: color,
                            highlight: {
                                background: '#ffffff',
                                border: '#6366f1'
                            }
                        },
                        font: { color: fontColor, face: 'Outfit' },
                        shadow: { enabled: true, color: 'rgba(0,0,0,0.5)' },
                        size: n.type === 'user' ? 25 : 18
                    };
                });

                // Build Vis.js Edges
                graphEdges = data.edges.map(e => {
                    return {
                        id: e.id,
                        from: e.source,
                        to: e.target,
                        label: e.label,
                        arrows: 'to',
                        color: { color: '#475569', highlight: '#818cf8' },
                        font: { color: '#94a3b8', background: '#0f172a', size: 11, face: 'Outfit' },
                        width: 1.5
                    };
                });

                // Render Network
                const container = document.getElementById('mynetwork');
                const networkData = {
                    nodes: new vis.DataSet(graphNodes),
                    edges: new vis.DataSet(graphEdges)
                };

                const options = {
                    physics: {
                        barnesHut: {
                            gravitationalConstant: -3000,
                            centralGravity: 0.3,
                            springLength: 150,
                            damping: 0.9
                        }
                    },
                    interaction: {
                        hover: true,
                        tooltipDelay: 200
                    }
                };

                network = new vis.Network(container, networkData, options);

            } catch (err) {
                console.error("Error loading graph:", err);
            }
        }

        function populateDropdowns(nodes) {
            const userSubjectSelect = document.getElementById('userSubjectSelect');
            const resourceSubjectSelect = document.getElementById('resourceSubjectSelect');
            const targetSelect = document.getElementById('targetSelect');
            const checkUserSelect = document.getElementById('checkUserSelect');
            const checkTargetSelect = document.getElementById('checkTargetSelect');

            // Store current values
            const valUserSub = userSubjectSelect.value;
            const valResSub = resourceSubjectSelect.value;
            const valTarget = targetSelect.value;
            const valCheckUser = checkUserSelect.value;
            const valCheckTarget = checkTargetSelect.value;

            // Clear
            userSubjectSelect.innerHTML = '<option value="">Select User...</option>';
            resourceSubjectSelect.innerHTML = '<option value="">Select Resource...</option>';
            targetSelect.innerHTML = '<option value="">Select Target...</option>';
            checkUserSelect.innerHTML = '<option value="">Select User...</option>';
            checkTargetSelect.innerHTML = '<option value="">Select Target...</option>';

            nodes.forEach(n => {
                const opt = document.createElement('option');
                opt.value = n.id.split(':')[1];
                opt.textContent = n.label;

                if (n.type === 'user') {
                    userSubjectSelect.appendChild(opt.cloneNode(true));
                    checkUserSelect.appendChild(opt.cloneNode(true));
                } else {
                    resourceSubjectSelect.appendChild(opt.cloneNode(true));
                    targetSelect.appendChild(opt.cloneNode(true));
                    checkTargetSelect.appendChild(opt.cloneNode(true));
                }
            });

            // Restore values if still exist
            userSubjectSelect.value = valUserSub;
            resourceSubjectSelect.value = valResSub;
            targetSelect.value = valTarget;
            checkUserSelect.value = valCheckUser;
            checkTargetSelect.value = valCheckTarget;
        }

        // Add User Form Submission
        async function addUser(e) {
            e.preventDefault();
            const inputs = e.target.querySelectorAll('input');
            const name = inputs[0].value;
            const email = inputs[1].value;
            const password = inputs[2].value;

            const res = await fetch('/api/v2.1/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            if (res.ok) {
                e.target.reset();
                loadGraph();
            } else {
                alert("Failed to create user.");
            }
        }

        // Add Resource Form Submission
        async function addResource(e) {
            e.preventDefault();
            const type = e.target.querySelector('select').value;
            const name = e.target.querySelector('input').value;

            const res = await fetch('/api/v2.1/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, name })
            });

            if (res.ok) {
                e.target.reset();
                loadGraph();
            } else {
                alert("Failed to create resource.");
            }
        }

        // Add Relationship Form Submission
        async function addRelationship(e) {
            e.preventDefault();
            const subjectType = document.getElementById('subjectType').value;
            const userSubjectId = document.getElementById('userSubjectSelect').value;
            const resourceSubjectId = document.getElementById('resourceSubjectSelect').value;
            const relation = document.getElementById('relationInput').value;
            const objectId = document.getElementById('targetSelect').value;

            const body = {
                relation,
                objectId: Number(objectId)
            };

            if (subjectType === 'user') {
                body.userSubjectId = Number(userSubjectId);
            } else {
                body.resourceSubjectId = Number(resourceSubjectId);
            }

            const res = await fetch('/api/v2.1/relationships', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                document.getElementById('relationInput').value = '';
                loadGraph();
            } else {
                alert("Failed to create relationship.");
            }
        }

        // Reset Database
        async function resetDb() {
            if (confirm("Are you sure you want to delete all Users, Resources, and Relationships?")) {
                const res = await fetch('/api/v2.1/deleteAll', { method: 'POST' });
                if (res.ok) {
                    loadGraph();
                    document.getElementById('traceLog').innerHTML = '<div class="text-xs text-slate-500 italic text-center py-8">Run a permission check to view the live evaluation path</div>';
                    document.getElementById('traceStatusBadge').classList.add('hidden');
                }
            }
        }

        // checkPermission with Live DFS Animate
        async function checkPermission(e) {
            e.preventDefault();
            const userId = document.getElementById('checkUserSelect').value;
            const resourceId = document.getElementById('checkTargetSelect').value;
            const permission = document.getElementById('checkPermissionInput').value;

            const traceLog = document.getElementById('traceLog');
            const badge = document.getElementById('traceStatusBadge');

            traceLog.innerHTML = '<div class="text-xs text-slate-400 animate-pulse text-center py-8">Requesting permission check...</div>';
            badge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400";
            badge.textContent = "RUNNING";
            badge.classList.remove('hidden');

            try {
                const res = await fetch('/api/v2.1/check?userId=' + userId + '&resourceId=' + resourceId + '&permission=' + permission);
                const outcome = await res.json();

                // Clear highlights
                resetGraphHighlight();

                // Start DFS Animation
                animateDFS(outcome.trace, outcome.allowed);

            } catch (err) {
                console.error("Evaluation failed:", err);
                traceLog.innerHTML = '<div class="text-xs text-rose-500 font-bold py-4">Evaluation encountered an error.</div>';
                badge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400";
                badge.textContent = "ERROR";
            }
        }

        function resetGraphHighlight() {
            // Re-render graph using standard colors
            loadGraph();
        }

        async function animateDFS(trace, finalResult) {
            const traceLog = document.getElementById('traceLog');
            traceLog.innerHTML = ''; // clear loading state

            if (trace.length === 0) {
                traceLog.innerHTML = '<div class="text-xs text-slate-500 italic text-center py-8">No matching rules found in schema.</div>';
                showFinalResultBadge(finalResult);
                return;
            }

            // Iterate over trace steps with sleep
            for (let i = 0; i < trace.length; i++) {
                const step = trace[i];
                const targetNodeId = 'resource:' + step.resourceId;

                // 1. Highlight Node in processing state (Yellow)
                highlightNode(targetNodeId, '#eab308');

                // 2. Add log entry (yellow status)
                const logItem = document.createElement('div');
                logItem.id = 'trace-step-' + i;
                logItem.className = "bg-slate-900 border border-amber-500/30 rounded-lg p-2.5 transition-all text-xs flex flex-col gap-1 slide-in";
                logItem.innerHTML = '<div class="flex items-center justify-between font-semibold">' +
                    '<span class="text-slate-200">' + step.resourceType.toUpperCase() + ':' + step.resourceId + '</span>' +
                    '<span class="text-amber-400 flex items-center gap-1">' +
                        '<span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> Checking...' +
                    '</span>' +
                '</div>' +
                '<div class="text-[10px] text-slate-400 font-medium">Checking Rule: ' + step.rule + '</div>';
                traceLog.appendChild(logItem);
                traceLog.scrollTop = traceLog.scrollHeight; // scroll to bottom

                // Sleep for 1000ms to visualize process
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 3. Complete Step (Result: Green/Red)
                const isPassed = step.result;
                const statusColor = isPassed ? 'text-emerald-400' : 'text-rose-400';
                const statusLabel = isPassed ? 'PASSED' : 'FAILED';
                const nodeColor = isPassed ? '#22c55e' : '#ef4444';
                const borderColor = isPassed ? 'border-emerald-500/30' : 'border-rose-500/30';
                const bgColor = isPassed ? 'bg-emerald-950/20' : 'bg-rose-950/20';

                // Update log item
                logItem.className = bgColor + ' border ' + borderColor + ' rounded-lg p-2.5 transition-all text-xs flex flex-col gap-1';
                logItem.innerHTML = '<div class="flex items-center justify-between font-semibold">' +
                    '<span class="text-slate-200">' + step.resourceType.toUpperCase() + ':' + step.resourceId + '</span>' +
                    '<span class="' + statusColor + ' font-bold">' + statusLabel + '</span>' +
                '</div>' +
                '<div class="text-[10px] text-slate-400 font-medium">Rule evaluated: ' + step.rule + '</div>';

                // Update Node Color in Network
                highlightNode(targetNodeId, nodeColor);
            }

            // Display Final Access Verdict
            showFinalResultBadge(finalResult);
        }

        function highlightNode(nodeId, color) {
            if (!network) return;

            // Find visual node in network and adjust color
            try {
                // Update network node color
                network.body.data.nodes.update({
                    id: nodeId,
                    color: {
                        background: color,
                        border: color
                    }
                });
            } catch (err) {
                console.warn("Node not found for styling:", nodeId);
            }
        }

        function showFinalResultBadge(allowed) {
            const badge = document.getElementById('traceStatusBadge');
            const traceLog = document.getElementById('traceLog');

            if (allowed) {
                badge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400";
                badge.textContent = "ALLOWED";

                const verdict = document.createElement('div');
                verdict.className = "mt-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg p-4 text-center font-bold text-sm shadow-lg animate-bounce shrink-0";
                verdict.textContent = "ACCESS GRANTED";
                traceLog.appendChild(verdict);
            } else {
                badge.className = "px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400";
                badge.textContent = "DENIED";

                const verdict = document.createElement('div');
                verdict.className = "mt-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg p-4 text-center font-bold text-sm shadow-lg shrink-0";
                verdict.textContent = "ACCESS DENIED";
                traceLog.appendChild(verdict);
            }

            traceLog.scrollTop = traceLog.scrollHeight;
        }
    </script>
</body>
</html>
`);
};