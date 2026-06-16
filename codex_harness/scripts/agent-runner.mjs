import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const harnessRoot = dirname(scriptDir);
const defaultConfigPath = join(harnessRoot, "codex-harness.config.json");
const workflowNames = ["implement-feature", "fix-bug", "review-and-refactor"];

function usage(exitCode = 1) {
  console.error("Usage:");
  console.error('  node codex_harness/scripts/agent-runner.mjs init [--project-root <path>] [--force]');
  console.error('  node codex_harness/scripts/agent-runner.mjs <workflow> "<task>" [--project-root <path>] [--dry-run] [--non-interactive] [--max-retries <n>]');
  console.error("");
  console.error("Workflows:");
  for (const workflowName of workflowNames) {
    console.error(`  ${workflowName}`);
  }
  process.exit(exitCode);
}

function parseArgs(argv) {
  const options = {
    command: null,
    workflowName: null,
    taskParts: [],
    projectRoot: process.cwd(),
    configPath: null,
    dryRun: false,
    nonInteractive: false,
    force: false,
    maxRetries: null,
  };

  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    usage(argv.length === 0 ? 1 : 0);
  }

  options.command = argv[0];
  const remaining = argv.slice(1);

  if (options.command === "run") {
    options.workflowName = remaining.shift();
  } else if (options.command !== "init" && options.command !== "install") {
    options.workflowName = options.command;
    options.command = "run";
  }

  for (let i = 0; i < remaining.length; i += 1) {
    const arg = remaining[i];

    if (arg === "--project-root") {
      options.projectRoot = remaining[++i];
    } else if (arg === "--config") {
      options.configPath = remaining[++i];
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--non-interactive") {
      options.nonInteractive = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--max-retries") {
      options.maxRetries = Number.parseInt(remaining[++i], 10);
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    } else if (options.command === "run") {
      options.taskParts.push(arg);
    } else {
      console.error(`Unexpected argument for ${options.command}: ${arg}`);
      process.exit(1);
    }
  }

  options.projectRoot = resolve(options.projectRoot);

  if (options.configPath) {
    options.configPath = isAbsolute(options.configPath)
      ? options.configPath
      : resolve(process.cwd(), options.configPath);
  }

  if (
    options.maxRetries !== null &&
    (!Number.isInteger(options.maxRetries) || options.maxRetries < 0)
  ) {
    console.error("--max-retries must be a non-negative integer.");
    process.exit(1);
  }

  return options;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`Failed to read JSON config at ${path}: ${error.message}`);
    process.exit(1);
  }
}

function resolveFrom(baseDir, path) {
  return isAbsolute(path) ? path : resolve(baseDir, path);
}

function loadConfig(options) {
  const projectConfigPath = join(options.projectRoot, "codex-harness.config.json");
  const configPath = options.configPath
    ? options.configPath
    : existsSync(projectConfigPath)
      ? projectConfigPath
      : defaultConfigPath;

  if (!existsSync(configPath)) {
    console.error(`Config file not found: ${configPath}`);
    process.exit(1);
  }

  const config = readJson(configPath);
  config.policy = {
    onAmbiguity: "choose-safe-default",
    onMissingTests: "document-gap",
    onReviewerChanges: "auto-fix-once",
    onDependencyNeeded: "block",
    onDestructiveAction: "block",
    ...(config.policy || {}),
  };
  const configDir = dirname(configPath);
  const paths = {
    configPath,
    configDir,
    rolesDir: resolveFrom(configDir, config.rolesDir || ".agents/roles"),
    workflowsDir: resolveFrom(configDir, config.workflowsDir || ".agents/workflows"),
    reportsDir: resolveFrom(configDir, config.reportsDir || "reports"),
  };

  return { config, paths };
}

function writeIfAllowed(targetPath, contents, force) {
  const existed = existsSync(targetPath);

  if (existed && !force) {
    return "skipped";
  }

  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, contents);
  return existed ? "overwritten" : "created";
}

function copyDirIfAllowed(sourcePath, targetPath, force) {
  const existed = existsSync(targetPath);

  if (existed && !force) {
    return "skipped";
  }

  mkdirSync(dirname(targetPath), { recursive: true });
  cpSync(sourcePath, targetPath, { recursive: true, force });
  return existed ? "overwritten" : "created";
}

function initProject(options) {
  mkdirSync(options.projectRoot, { recursive: true });

  const config = readJson(defaultConfigPath);
  const targetConfig = {
    ...config,
    rolesDir: ".agents/roles",
    workflowsDir: ".agents/workflows",
    reportsDir: "reports",
  };

  const actions = [
    {
      label: "AGENTS.md",
      status: writeIfAllowed(
        join(options.projectRoot, "AGENTS.md"),
        readFileSync(join(harnessRoot, "AGENTS.template.md"), "utf8"),
        options.force
      ),
    },
    {
      label: ".agents/roles",
      status: copyDirIfAllowed(
        join(harnessRoot, ".agents", "roles"),
        join(options.projectRoot, ".agents", "roles"),
        options.force
      ),
    },
    {
      label: ".agents/workflows",
      status: copyDirIfAllowed(
        join(harnessRoot, ".agents", "workflows"),
        join(options.projectRoot, ".agents", "workflows"),
        options.force
      ),
    },
    {
      label: "codex-harness.config.json",
      status: writeIfAllowed(
        join(options.projectRoot, "codex-harness.config.json"),
        `${JSON.stringify(targetConfig, null, 2)}\n`,
        options.force
      ),
    },
  ];

  console.log(`Initialized Codex harness files in ${options.projectRoot}`);
  for (const action of actions) {
    console.log(`- ${action.label}: ${action.status}`);
  }
}

function loadWorkflow(name, paths, roles) {
  const workflowPath = join(paths.workflowsDir, `${name}.md`);

  if (!existsSync(workflowPath)) {
    console.error(`Unknown workflow: ${name}`);
    console.error(`Looked in: ${paths.workflowsDir}`);
    process.exit(1);
  }

  const workflowPrompt = readFileSync(workflowPath, "utf8");
  const executionMatch = workflowPrompt.match(
    /## Execution roles\s*\n([\s\S]*?)(?:\n## |\n# |$)/
  );

  if (!executionMatch) {
    console.error(`Workflow ${name} is missing a "## Execution roles" section.`);
    process.exit(1);
  }

  const selectedRoles = executionMatch[1]
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*\d+\.\s+([a-z-]+)\s*$/)?.[1])
    .filter(Boolean);

  if (selectedRoles.length === 0) {
    console.error(`Workflow ${name} does not define any execution roles.`);
    process.exit(1);
  }

  for (const roleName of selectedRoles) {
    if (!roles[roleName]) {
      console.error(`Workflow ${name} references unknown role: ${roleName}`);
      process.exit(1);
    }
  }

  return { workflowPath, workflowPrompt, selectedRoles };
}

function loadRoles(paths, config) {
  const roleNames = Object.keys(config.sandbox || {
    architect: "read-only",
    implementer: "workspace-write",
    tester: "workspace-write",
    reviewer: "read-only",
    debugger: "workspace-write",
  });

  return Object.fromEntries(
    roleNames.map((roleName) => [roleName, join(paths.rolesDir, `${roleName}.md`)])
  );
}

function checkCodex(codexCommand) {
  const result = spawnSync(codexCommand, ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error || result.status !== 0) {
    console.error(`Codex CLI is not available via "${codexCommand}".`);
    console.error("Install or configure Codex CLI before running the harness.");
    if (result.error) {
      console.error(result.error.message);
    } else if (result.stderr?.trim()) {
      console.error(result.stderr.trim());
    }
    process.exit(1);
  }

  return (result.stdout || result.stderr || "").trim();
}

function parseResult(stdout) {
  const jsonLine = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith("HARNESS_RESULT:"));

  if (jsonLine) {
    try {
      const parsed = JSON.parse(jsonLine.slice("HARNESS_RESULT:".length).trim());
      if (typeof parsed.decision === "string") {
        return {
          decision: parsed.decision.toUpperCase(),
          summary: parsed.summary || "",
        };
      }
    } catch {
      return { decision: "INVALID_RESULT", summary: "HARNESS_RESULT was not valid JSON." };
    }
  }

  const trailerMatch = stdout.match(
    /^(?:Harness-Decision|Approval Decision):\s*(APPROVED|NEEDS_CHANGES|DONE|FAILED|BLOCKED)\s*$/im
  );

  if (trailerMatch) {
    return { decision: trailerMatch[1].toUpperCase(), summary: "" };
  }

  if (stdout.includes("NEEDS_CHANGES")) {
    return { decision: "NEEDS_CHANGES", summary: "" };
  }

  if (stdout.includes("APPROVED")) {
    return { decision: "APPROVED", summary: "" };
  }

  return { decision: "UNKNOWN", summary: "" };
}

function runCodexRole({ codexCommand, args, cwd }) {
  return new Promise((resolvePromise) => {
    const child = spawn(codexCommand, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("error", (error) => {
      resolvePromise({ status: 1, stdout, stderr: `${stderr}\n${error.message}` });
    });

    child.on("close", (status) => {
      resolvePromise({ status: status ?? 1, stdout, stderr });
    });
  });
}

function buildPrompt({
  roleName,
  rolePrompt,
  workflowName,
  workflowPath,
  workflowPrompt,
  context,
  config,
  options,
}) {
  const interactionPolicy = options.nonInteractive
    ? `
# Non-Interactive Policy

Do not ask the user for confirmation or clarification during this run.
Use the configured policy:

- Ambiguity: ${config.policy.onAmbiguity}
- Missing tests: ${config.policy.onMissingTests}
- Reviewer changes: ${config.policy.onReviewerChanges}
- New dependency needed: ${config.policy.onDependencyNeeded}
- Destructive action: ${config.policy.onDestructiveAction}

Proceed with safe, reversible local actions. If a step is destructive,
credential-gated, production-impacting, or materially scope-changing, do not ask;
return BLOCKED and explain the blocker in the summary.
Record any automatic assumptions or decisions in your output.
`
    : `
# Interaction Policy

Ask only when missing information would materially change the result or create
meaningful risk. Otherwise choose a safe default and document the assumption.
`;

  return `
${rolePrompt}

# Current Workflow

${workflowName}

# Workflow Definition

Source: ${workflowPath}

${workflowPrompt}

# Task Context

${context}

# Harness Commands

Test command: ${config.commands?.test || "not configured"}
Review command: ${config.commands?.review || "not configured"}

${interactionPolicy}

# Role Instruction

Work as the ${roleName} agent.
Follow AGENTS.md, the workflow definition, and your role definition.

# Important

- If you are architect or reviewer, do not edit files.
- If you are implementer, tester, or debugger, edit only necessary files.
- Report exact files changed and commands run.
- End with a machine-readable result line:
  HARNESS_RESULT: {"decision":"APPROVED|NEEDS_CHANGES|DONE|FAILED|BLOCKED","summary":"one short sentence"}
`;
}

function writeSummaryReport({
  paths,
  runId,
  workflowName,
  userTask,
  options,
  config,
  decision,
  fixLoops,
  roleRuns,
}) {
  if (options.dryRun) {
    return null;
  }

  mkdirSync(paths.reportsDir, { recursive: true });
  const summaryPath = join(paths.reportsDir, `${runId}-summary.md`);
  const lines = [
    "# Codex Harness Run Summary",
    "",
    `Status: ${decision}`,
    `Task: ${userTask}`,
    `Initial workflow: ${workflowName}`,
    `Project root: ${options.projectRoot}`,
    `Config: ${paths.configPath}`,
    `Non-interactive: ${options.nonInteractive ? "yes" : "no"}`,
    `Fix loops used: ${fixLoops}`,
    "",
    "## Policy",
    "",
    `- Ambiguity: ${config.policy.onAmbiguity}`,
    `- Missing tests: ${config.policy.onMissingTests}`,
    `- Reviewer changes: ${config.policy.onReviewerChanges}`,
    `- New dependency needed: ${config.policy.onDependencyNeeded}`,
    `- Destructive action: ${config.policy.onDestructiveAction}`,
    "",
    "## Role Results",
    "",
  ];

  for (const run of roleRuns) {
    lines.push(
      `- ${run.workflowName} / ${run.roleName}: ${run.decision}${run.summary ? ` - ${run.summary}` : ""}`,
      `  Report: ${run.reportPath}`
    );
  }

  lines.push("", "## Stop Condition", "");
  if (decision === "APPROVED" || decision === "DONE" || decision === "DRY_RUN") {
    lines.push("The workflow reached a non-error terminal decision.");
  } else if (decision === "NEEDS_CHANGES") {
    lines.push("Reviewer still requested changes after the configured fix loop limit.");
  } else if (decision === "BLOCKED") {
    lines.push("A role reported a blocker under the configured interaction policy.");
  } else {
    lines.push("The workflow ended with an unresolved or unknown decision.");
  }

  writeFileSync(summaryPath, `${lines.join("\n")}\n`);
  return summaryPath;
}

async function runWorkflow({
  workflowName,
  userTask,
  options,
  config,
  paths,
  roles,
  runId,
  inheritedContext = "",
}) {
  const { workflowPath, workflowPrompt, selectedRoles } = loadWorkflow(
    workflowName,
    paths,
    roles
  );

  if (options.dryRun) {
    console.log(`Dry run for workflow: ${workflowName}`);
    console.log(`Project root: ${options.projectRoot}`);
    console.log(`Config: ${paths.configPath}`);
    console.log(`Workflow: ${workflowPath}`);
    console.log(`Reports: ${paths.reportsDir}`);
    console.log("Roles:");
    for (const roleName of selectedRoles) {
      const sandbox = config.sandbox?.[roleName] || "workspace-write";
      console.log(`- ${roleName} (${sandbox})`);
    }
    return { decision: "DRY_RUN", context: inheritedContext, runs: [] };
  }

  mkdirSync(paths.reportsDir, { recursive: true });

  let context = `
# User Task

${userTask}

# Previous Agent Outputs

${inheritedContext || "None yet."}
`;

  let lastDecision = "UNKNOWN";
  const runs = [];

  for (let index = 0; index < selectedRoles.length; index += 1) {
    const roleName = selectedRoles[index];
    const rolePath = roles[roleName];
    const rolePrompt = readFileSync(rolePath, "utf8");
    const sandbox = config.sandbox?.[roleName] || "workspace-write";
    const fullPrompt = buildPrompt({
      roleName,
      rolePrompt,
      workflowName,
      workflowPath,
      workflowPrompt,
      context,
      config,
      options,
    });

    console.log("\n==============================");
    console.log(`Running role: ${roleName}`);
    console.log(`Sandbox: ${sandbox}`);
    console.log("==============================\n");

    const args = ["exec", "--sandbox", sandbox, "--color", "never", fullPrompt];
    const result = await runCodexRole({
      codexCommand: config.codexCommand || "codex",
      args,
      cwd: options.projectRoot,
    });

    const reportPath = join(
      paths.reportsDir,
      `${runId}-${workflowName}-${String(index + 1).padStart(2, "0")}-${roleName}.md`
    );
    writeFileSync(reportPath, result.stdout);

    const parsedResult = parseResult(result.stdout);
    lastDecision = parsedResult.decision;
    runs.push({
      workflowName,
      roleName,
      sandbox,
      decision: parsedResult.decision,
      summary: parsedResult.summary,
      reportPath,
      status: result.status,
    });
    context += `

---

# Output from ${roleName}

${result.stdout}
`;

    if (result.status !== 0) {
      console.error(`Role ${roleName} failed with exit code ${result.status}`);
      process.exit(result.status ?? 1);
    }
  }

  return { decision: lastDecision, context, runs };
}

async function run(options) {
  const userTask = options.taskParts.join(" ").trim();

  if (!options.workflowName || !userTask) {
    usage(1);
  }

  const { config, paths } = loadConfig(options);
  const roles = loadRoles(paths, config);
  const maxFixLoops =
    options.maxRetries !== null ? options.maxRetries : config.maxFixLoops ?? 1;
  const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;

  if (!options.dryRun) {
    const version = checkCodex(config.codexCommand || "codex");
    console.log(`Codex CLI: ${version}`);
  }

  let result = await runWorkflow({
    workflowName: options.workflowName,
    userTask,
    options,
    config,
    paths,
    roles,
    runId,
  });
  const roleRuns = [...result.runs];

  let fixLoops = 0;
  while (
    result.decision === "NEEDS_CHANGES" &&
    options.workflowName !== "fix-bug" &&
    fixLoops < maxFixLoops
  ) {
    fixLoops += 1;
    console.log(`\nReviewer requested changes. Running fix-bug loop ${fixLoops}/${maxFixLoops}.`);
    result = await runWorkflow({
      workflowName: "fix-bug",
      userTask,
      options,
      config,
      paths,
      roles,
      runId,
      inheritedContext: result.context,
    });
    roleRuns.push(...result.runs);
  }

  const summaryPath = writeSummaryReport({
    paths,
    runId,
    workflowName: options.workflowName,
    userTask,
    options,
    config,
    decision: result.decision,
    fixLoops,
    roleRuns,
  });

  if (result.decision === "NEEDS_CHANGES") {
    console.log("\nWorkflow ended with reviewer-requested changes.");
    if (summaryPath) {
      console.log(`Summary report: ${summaryPath}`);
    }
    process.exitCode = 2;
    return;
  }

  console.log(`\nWorkflow complete. Final decision: ${result.decision}`);
  if (summaryPath) {
    console.log(`Summary report: ${summaryPath}`);
  }
}

const options = parseArgs(process.argv.slice(2));

if (options.command === "init" || options.command === "install") {
  initProject(options);
} else {
  await run(options);
}
