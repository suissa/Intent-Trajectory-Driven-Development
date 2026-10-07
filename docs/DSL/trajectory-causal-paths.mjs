export function analyzeCausalPaths(graph, options = {}) {
  const maxDepth = Math.max(1, Math.floor(options.maxDepth ?? 4));
  const minPathDepth = Math.max(1, Math.floor(options.minPathDepth ?? 1));
  const nodes = [...(graph.nodes ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  const edges = [...(graph.edges ?? [])].sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || b.lift - a.lift);
  const outgoing = new Map(nodes.map(node => [node.id, []]));
  const incoming = new Map(nodes.map(node => [node.id, []]));
  for (const edge of edges) {
    outgoing.get(edge.from)?.push(edge);
    incoming.get(edge.to)?.push(edge);
  }
  for (const list of outgoing.values()) list.sort((a, b) => a.to.localeCompare(b.to) || b.lift - a.lift);

  const paths = [];
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const visit = (nodeId, nodePath, edgePath) => {
    if (edgePath.length >= minPathDepth) {
      const lifts = edgePath.map(edge => edge.lift);
      const supports = edgePath.map(edge => edge.support);
      paths.push({
        nodes: [...nodePath],
        edgeIds: edgePath.map(edge => edge.id),
        depth: edgePath.length,
        support: Math.min(...supports),
        minLift: Math.min(...lifts),
        pathScore: Math.min(...lifts),
        terminalType: nodeById.get(nodeId)?.type ?? "unknown"
      });
    }
    if (edgePath.length >= maxDepth) return;
    for (const edge of outgoing.get(nodeId) ?? []) {
      if (!nodePath.includes(edge.to)) visit(edge.to, [...nodePath, edge.to], [...edgePath, edge]);
    }
  };
  for (const node of nodes) visit(node.id, [node.id], []);

  paths.sort((a, b) => b.depth - a.depth || b.pathScore - a.pathScore || b.support - a.support ||
    a.nodes.join("->").localeCompare(b.nodes.join("->")));

  const convergencePoints = nodes.filter(node => (incoming.get(node.id) ?? []).length > 1)
    .map(node => ({ node: node.id, incoming: incoming.get(node.id).map(edge => edge.from).sort() }));
  const divergencePoints = nodes.filter(node => (outgoing.get(node.id) ?? []).length > 1)
    .map(node => ({ node: node.id, outgoing: outgoing.get(node.id).map(edge => edge.to).sort() }));

  const rootCauseCandidates = nodes
    .filter(node => (incoming.get(node.id) ?? []).length === 0)
    .map(node => {
      const reachable = paths.filter(path => path.nodes[0] === node.id && path.terminalType === "divergence");
      const best = [...reachable].sort((a, b) => b.pathScore - a.pathScore || b.support - a.support || a.depth - b.depth)[0];
      return { node: node.id, score: best?.pathScore ?? 0, support: best?.support ?? 0, reachesDivergence: Boolean(best) };
    })
    .filter(candidate => candidate.reachesDivergence)
    .sort((a, b) => b.score - a.score || b.support - a.support || a.node.localeCompare(b.node));

  return { version: 1, maxDepth, paths, recurringPaths: paths.filter(path => path.depth > 1),
    convergencePoints, divergencePoints, rootCauseCandidates };
}
