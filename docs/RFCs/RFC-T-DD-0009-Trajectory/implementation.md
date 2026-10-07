# Implementation — RFC-T-DD-0009

The Trajectory Skill composes the Atomic Skills in semantic order.

Runtime implementations SHOULD persist or stream a trajectory record containing stable semantic identifiers and ordered evidence.

A trajectory comparator MUST distinguish:
- legal progression;
- missing mandatory evidence;
- forbidden transitions;
- unauthorized actions;
- extra undeclared semantic events;
- incomplete terminal conditions.

The trajectory is the principal artifact used to determine whether execution conforms to the specification.

See [Trajectory Skill](../../skills/Trajectory-SKILL.md).
