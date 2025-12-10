const state = {
  monsters: [],
  missions: [],
  collection: [],
  team: [],
  workers: [],
  rackets: [
    {
      id: "corner_watch",
      name: "Corner Watch",
      duration: 60000,
      payout: { cash: 120, heat: -1, xp: 8 },
      flavor: "Post your muscle on key corners to keep tribute flowing.",
    },
    {
      id: "dock_rigging",
      name: "Dock Rigging",
      duration: 90000,
      payout: { cash: 180, captureKits: 1, xp: 10 },
      requirement: { affinity: "Water" },
      flavor: "Prep the harbor for smuggling lanes and extra kits.",
    },
    {
      id: "signal_hijack",
      name: "Signal Hijack",
      duration: 120000,
      payout: { cash: 250, heat: 2, xp: 14 },
      requirement: { affinity: "Tech" },
      flavor: "Tap into the city grid for steady crypto drains.",
    },
    {
      id: "club_security",
      name: "Club Security",
      duration: 75000,
      payout: { cash: 160, notoriety: 2, xp: 9 },
      flavor: "Bounce rowdy patrons, keep the clientele paying up.",
    },
  ],
  arenaOpponents: [
    { id: "street_crew", name: "Alley Crew", power: 280, rewardCash: 500, rewardNotoriety: 6 },
    { id: "syndicate_pair", name: "Syndicate Pair", power: 420, rewardCash: 850, rewardNotoriety: 10 },
    { id: "enforcer_unit", name: "Enforcer Unit", power: 620, rewardCash: 1250, rewardNotoriety: 14 },
  ],
  activeMission: null,
  filters: { district: "all" },
  player: {
    cash: 1200,
    heat: 0,
    captureKits: 4,
    stamina: 20,
    staminaMax: 20,
    notoriety: 0,
  },
};

const elements = {};

async function loadYaml(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  const text = await response.text();
  return jsyaml.load(text);
}

function createMonsterInstance(base) {
  return {
    ...base,
    baseId: base.id,
    instanceId: `${base.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    level: 1,
    xp: 0,
    isWorking: false,
    currentJob: null,
  };
}

function levelScaledStats(monster) {
  const scale = 1 + (monster.level - 1) * 0.08;
  const stats = monster.stats || {};
  return {
    hp: Math.round((stats.hp || 0) * scale),
    attack: Math.round((stats.attack || 0) * scale),
    special: Math.round((stats.special || 0) * scale),
    defense: Math.round((stats.defense || 0) * scale),
    speed: Math.round((stats.speed || 0) * scale),
    grit: Math.round((stats.grit || 0) * scale),
    loyalty: stats.loyalty || 0,
  };
}

function monsterPower(monster) {
  const stats = levelScaledStats(monster);
  return (
    stats.hp * 0.2 +
    stats.attack * 0.85 +
    stats.special * 0.75 +
    stats.defense * 0.55 +
    stats.speed * 0.65 +
    stats.grit * 1.2 +
    monster.level * 8
  );
}

function calculateTeamPower() {
  return state.team.reduce((total, monster) => total + monsterPower(monster), 0);
}

function formatRewards(rewards) {
  const parts = [];
  if (!rewards) return "None listed";
  if (rewards.cash) parts.push(`$${rewards.cash}`);
  if (rewards.notoriety) parts.push(`${rewards.notoriety} notoriety`);
  if (rewards.gear_components) parts.push(`${rewards.gear_components} gear comp`);
  if (rewards.reagents) parts.push(`${rewards.reagents} reagents`);
  if (rewards.influence) parts.push(`${rewards.influence} influence`);
  if (rewards.dna_shards) {
    parts.push(`${rewards.dna_shards.amount} ${rewards.dna_shards.affinity} DNA`);
  }
  return parts.join(" · ") || "Mystery";
}

function logEvent(text, type = "info") {
  const item = document.createElement("li");
  item.textContent = text;
  if (type === "success") item.classList.add("success");
  if (type === "fail") item.classList.add("fail");
  elements.log.prepend(item);
  while (elements.log.children.length > 80) {
    elements.log.removeChild(elements.log.lastChild);
  }
}

function renderResources() {
  elements.cash.textContent = Math.floor(state.player.cash);
  elements.heat.textContent = state.player.heat;
  elements.captureKits.textContent = state.player.captureKits;
  elements.stamina.textContent = state.player.stamina;
  elements.staminaMax.textContent = state.player.staminaMax;
  elements.teamPower.textContent = Math.round(calculateTeamPower());
  elements.notoriety.textContent = state.player.notoriety;
}

function renderDistricts() {
  const districtMap = state.missions.reduce((acc, mission) => {
    acc[mission.district] = acc[mission.district] || { power: 0, count: 0 };
    acc[mission.district].power = Math.max(acc[mission.district].power, mission.recommended_power || 0);
    acc[mission.district].count += 1;
    return acc;
  }, {});
  elements.districtList.innerHTML = Object.entries(districtMap)
    .map(
      ([district, info]) => `
        <button class="district-card ${
          state.filters.district === district ? "active" : ""
        }" data-district="${district}">
          <h4>${district}</h4>
          <p>${info.count} jobs · up to ${info.power || "?"} power</p>
        </button>
      `
    )
    .join("") +
    `<button class="district-card ${state.filters.district === "all" ? "active" : ""}" data-district="all">
        <h4>All Districts</h4>
        <p>Show everything at once</p>
      </button>`;

  Array.from(elements.districtList.querySelectorAll("button")).forEach((btn) => {
    btn.addEventListener("click", () => {
      state.filters.district = btn.dataset.district;
      renderMissions();
    });
  });
}

function renderMissions() {
  const missions = state.missions.filter(
    (m) => state.filters.district === "all" || m.district === state.filters.district
  );
  elements.missionSelect.innerHTML = missions
    .map((m) => `<option value="${m.id}">${m.name} (${m.district})</option>`)
    .join("");
  updateMissionDetails();
}

function renderTeam() {
  elements.teamSlots.innerHTML = "";
  for (let i = 0; i < 3; i += 1) {
    const slot = document.createElement("div");
    slot.className = "team-slot";
    const monster = state.team[i];
    if (monster) {
      const stats = levelScaledStats(monster);
      slot.innerHTML = `<h4>${monster.name} (Lv${monster.level})</h4>
        <p>${monster.affinity} ${monster.role}</p>
        <p>Grit ${stats.grit} · Spd ${stats.speed}</p>
        <p class="tiny">${monster.isWorking ? "On the clock" : "Ready"}</p>`;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.className = "secondary";
      removeBtn.addEventListener("click", () => {
        state.team.splice(i, 1);
        renderTeam();
        renderResources();
        renderCollection();
      });
      removeBtn.disabled = !!monster.isWorking;
      slot.appendChild(removeBtn);
    } else {
      slot.innerHTML = `<h4>Empty Slot</h4><p>Drop in a captured monster.</p>`;
    }
    elements.teamSlots.appendChild(slot);
  }
}

function renderCollection() {
  const options = state.collection
    .filter((m) => !m.isWorking)
    .map((m) => `<option value="${m.instanceId}">${m.name} Lv${m.level} (${m.affinity})</option>`);
  elements.monsterSelect.innerHTML = state.monsters
    .map((m) => `<option value="${m.id}">${m.name} (${m.affinity})</option>`)
    .join("");
  elements.collectionSelect.innerHTML = `<option value="">-- choose --</option>${options.join("")}`;
  elements.workMonster.innerHTML = `<option value="">-- choose worker --</option>${options.join("")}`;

  elements.collectionTable.innerHTML = state.collection
    .map(
      (m) => {
        const stats = levelScaledStats(m);
        return `<tr>
          <td>${m.name}</td>
          <td>${m.affinity}</td>
          <td>${m.role}</td>
          <td>Lv${m.level}</td>
          <td>${stats.attack}/${stats.defense}/${stats.speed}</td>
          <td>${m.isWorking ? "Working" : "Idle"}</td>
        </tr>`;
      }
    )
    .join("");
}

function renderRackets() {
  elements.workList.innerHTML = state.rackets
    .map((job) => {
      const worker = state.workers.find((w) => w.jobId === job.id);
      const flavor = job.flavor ? `<p class="tiny">${job.flavor}</p>` : "";
      const req = job.requirement ? `<p class="tiny">Requires ${job.requirement.affinity} affinity</p>` : "";
      const status = worker
        ? `<p class="success">${worker.monster.name} earning $${job.payout.cash || 0}...</p>`
        : "<p>Unassigned</p>";
      return `<div class="work-card" data-job="${job.id}">
        <h4>${job.name}</h4>
        ${status}
        ${req}
        ${flavor}
      </div>`;
    })
    .join("");
}

function renderArena() {
  elements.arenaSelect.innerHTML = state.arenaOpponents
    .map((op) => `<option value="${op.id}">${op.name} (Power ${op.power})</option>`)
    .join("");
}

function grantStarterTeam() {
  state.collection = state.monsters.slice(0, 3).map((m) => createMonsterInstance(m));
  state.team = state.collection.slice(0, 2);
  logEvent("You start with a couple of streetwise beasts to keep you safe.", "success");
  renderCollection();
  renderTeam();
}

function addXp(monster, amount) {
  monster.xp += amount;
  const threshold = () => monster.level * 10 + 10;
  while (monster.xp >= threshold()) {
    monster.xp -= threshold();
    monster.level += 1;
    logEvent(`${monster.name} leveled up to ${monster.level}!`, "success");
  }
}

function updateMissionDetails() {
  const mission = state.missions.find((m) => m.id === elements.missionSelect.value);
  if (!mission) return;
  elements.missionStamina.textContent = mission.stamina_cost;
  elements.missionPower.textContent = mission.recommended_power;
  elements.missionRewards.textContent = formatRewards(mission.rewards);
  elements.missionDistrict.textContent = mission.district;
}

function startMission() {
  const mission = state.missions.find((m) => m.id === elements.missionSelect.value);
  if (!mission) return;
  if (state.activeMission) {
    logEvent("A mission is already running.");
    return;
  }
  if (state.player.stamina < mission.stamina_cost) {
    logEvent("Not enough stamina for that job.", "fail");
    return;
  }
  if (state.team.length === 0) {
    logEvent("Field a team before taking jobs.", "fail");
    return;
  }
  state.player.stamina -= mission.stamina_cost;
  state.player.heat += 2;
  const duration = 6000 + Math.max(0, mission.recommended_power - calculateTeamPower()) * 12;
  state.activeMission = { mission, started: Date.now(), duration };
  elements.activeMission.hidden = false;
  elements.activeMissionText.textContent = `Running ${mission.name}...`;
  elements.missionProgress.style.width = "0%";
  logEvent(`You sent the crew on ${mission.name}.`);
  renderResources();
}

function resolveMission() {
  const { mission } = state.activeMission;
  const teamPower = calculateTeamPower();
  const difficulty = mission.recommended_power || 1;
  const odds = Math.min(0.95, Math.max(0.25, teamPower / (difficulty * 1.2)));
  const success = Math.random() < odds;
  if (success) {
    const cashReward = mission.rewards?.cash ?? 0;
    state.player.cash += cashReward;
    if (mission.rewards?.dna_shards) state.player.heat += 1;
    if (mission.rewards?.gear_components) state.player.captureKits += 1;
    if (mission.rewards?.notoriety) state.player.notoriety += mission.rewards.notoriety;
    logEvent(`${mission.name} succeeded! Earned $${cashReward}.`, "success");
    state.team.forEach((m) => addXp(m, 6));
    const monsterEncounter = mission.encounters?.find((e) => e.type === "monster" || e.type === "boss");
    if (monsterEncounter && Math.random() < 0.35) {
      const targetId = monsterEncounter.enemy_team?.[0];
      const base = state.monsters.find((m) => m.id === targetId);
      if (base) {
        const copy = createMonsterInstance(base);
        state.collection.push(copy);
        logEvent(`Intel convinced ${base.name} to join your stable!`, "success");
      }
    }
  } else {
    state.player.heat += 3;
    logEvent(`${mission.name} was botched. Lay low and recover.`, "fail");
  }
  renderCollection();
  renderResources();
}

function tickActiveMission() {
  if (!state.activeMission) return;
  const now = Date.now();
  const elapsed = now - state.activeMission.started;
  const pct = Math.min(1, elapsed / state.activeMission.duration);
  elements.missionProgress.style.width = `${(pct * 100).toFixed(1)}%`;
  if (pct >= 1) {
    resolveMission();
    state.activeMission = null;
    elements.activeMission.hidden = true;
  }
}

function captureAttempt() {
  const baseMonster = state.monsters.find((m) => m.id === elements.monsterSelect.value);
  if (!baseMonster) return;
  if (state.player.captureKits <= 0) {
    logEvent("No capture kits left. Run missions to earn more.", "fail");
    return;
  }
  state.player.captureKits -= 1;
  const loyalty = baseMonster.stats?.loyalty ?? 0;
  const baseChance = 0.32 + loyalty / 120;
  const heatMod = Math.max(0.1, 1 - state.player.heat * 0.02);
  const finalChance = Math.min(0.92, baseChance * heatMod);
  const roll = Math.random();
  if (roll < finalChance) {
    const copy = createMonsterInstance(baseMonster);
    state.collection.push(copy);
    logEvent(`Captured ${baseMonster.name}! Heat eased after the win.`, "success");
    state.player.heat = Math.max(0, state.player.heat - 2);
    renderCollection();
  } else {
    state.player.heat += 2;
    logEvent(`${baseMonster.name} slipped away. Heat increased.`, "fail");
  }
  renderResources();
}

function addToTeam() {
  const id = elements.collectionSelect.value;
  if (!id) return;
  const monster = state.collection.find((m) => m.instanceId === id);
  if (!monster) return;
  if (monster.isWorking) {
    logEvent("Monster is out on a job and can't fight right now.", "fail");
    return;
  }
  if (state.team.length >= 3) {
    logEvent("Team is full. Remove someone first.");
    return;
  }
  state.team.push(monster);
  renderTeam();
  renderResources();
  renderCollection();
}

function assignWork() {
  const job = state.rackets.find((r) => r.id === elements.workSelect.value);
  const monster = state.collection.find((m) => m.instanceId === elements.workMonster.value);
  if (!job || !monster) return;
  if (monster.isWorking) {
    logEvent("That monster is already working.", "fail");
    return;
  }
  if (state.workers.find((w) => w.jobId === job.id)) {
    logEvent("That racket already has someone assigned.", "fail");
    return;
  }
  if (job.requirement?.affinity && !monster.affinity.includes(job.requirement.affinity)) {
    logEvent(`This job needs ${job.requirement.affinity} affinity.`, "fail");
    return;
  }
  const teamIndex = state.team.findIndex((t) => t.instanceId === monster.instanceId);
  if (teamIndex !== -1) {
    state.team.splice(teamIndex, 1);
    renderTeam();
  }
  monster.isWorking = true;
  monster.currentJob = { id: job.id, endsAt: Date.now() + job.duration };
  state.workers.push({ jobId: job.id, monster });
  logEvent(`${monster.name} started ${job.name}. Idle cash incoming!`, "success");
  renderRackets();
  renderCollection();
  renderResources();
}

function tickWork() {
  const now = Date.now();
  state.workers.forEach((w) => {
    if (now >= w.monster.currentJob.endsAt) {
      const job = state.rackets.find((r) => r.id === w.jobId);
      if (!job) return;
      if (job.payout.cash) state.player.cash += job.payout.cash;
      if (job.payout.captureKits) state.player.captureKits += job.payout.captureKits;
      if (job.payout.heat) state.player.heat = Math.max(0, state.player.heat + job.payout.heat);
      if (job.payout.notoriety) state.player.notoriety += job.payout.notoriety;
      addXp(w.monster, job.payout.xp || 4);
      logEvent(`${w.monster.name} finished ${job.name} and delivered $${job.payout.cash || 0}.`, "success");
      w.monster.isWorking = false;
      w.monster.currentJob = null;
    }
  });
  state.workers = state.workers.filter((w) => w.monster.isWorking);
  renderRackets();
  renderCollection();
  renderResources();
}

function startArenaBattle() {
  const opponent = state.arenaOpponents.find((o) => o.id === elements.arenaSelect.value);
  if (!opponent) return;
  if (state.team.length === 0) {
    logEvent("Field a team to battle in the Arena.", "fail");
    return;
  }
  const playerPower = calculateTeamPower();
  const odds = Math.min(0.9, Math.max(0.15, playerPower / (opponent.power * 1.1)));
  const success = Math.random() < odds;
  if (success) {
    state.player.cash += opponent.rewardCash;
    state.player.notoriety += opponent.rewardNotoriety;
    state.team.forEach((m) => addXp(m, 10));
    logEvent(`Beat ${opponent.name}! +$${opponent.rewardCash} and notoriety.`, "success");
  } else {
    state.player.heat += 4;
    logEvent(`${opponent.name} pushed your crew back. Heat rises!`, "fail");
  }
  renderResources();
}

function summonMonster() {
  const cost = 300;
  if (state.player.cash < cost) {
    logEvent("Not enough cash to summon. Run more rackets or missions.", "fail");
    return;
  }
  state.player.cash -= cost;
  const pick = state.monsters[Math.floor(Math.random() * state.monsters.length)];
  const monster = createMonsterInstance(pick);
  monster.level = Math.random() < 0.2 ? 2 : 1;
  state.collection.push(monster);
  logEvent(`Summoned ${monster.name}! They joined at level ${monster.level}.`, "success");
  renderCollection();
  renderResources();
}

function regenTick() {
  if (state.player.stamina < state.player.staminaMax) {
    state.player.stamina = Math.min(state.player.staminaMax, state.player.stamina + 1);
  }
  state.player.cash += 8; // idle drip
  state.player.heat = Math.max(0, state.player.heat - 1);
  renderResources();
}

async function init() {
  elements.cash = document.getElementById("cash");
  elements.heat = document.getElementById("heat");
  elements.captureKits = document.getElementById("capture-kits");
  elements.stamina = document.getElementById("stamina");
  elements.staminaMax = document.getElementById("stamina-max");
  elements.teamPower = document.getElementById("team-power");
  elements.notoriety = document.getElementById("notoriety");
  elements.districtList = document.getElementById("district-list");
  elements.missionSelect = document.getElementById("mission-select");
  elements.missionStamina = document.getElementById("mission-stamina");
  elements.missionPower = document.getElementById("mission-power");
  elements.missionRewards = document.getElementById("mission-rewards");
  elements.missionDistrict = document.getElementById("mission-district");
  elements.startMission = document.getElementById("start-mission");
  elements.activeMission = document.getElementById("active-mission");
  elements.activeMissionText = document.getElementById("active-mission-text");
  elements.missionProgress = document.getElementById("mission-progress");
  elements.log = document.getElementById("log");
  elements.monsterSelect = document.getElementById("monster-select");
  elements.collectionSelect = document.getElementById("collection-select");
  elements.teamSlots = document.getElementById("team-slots");
  elements.collectionTable = document.getElementById("collection-table");
  elements.workSelect = document.getElementById("work-select");
  elements.workMonster = document.getElementById("work-monster");
  elements.workList = document.getElementById("work-list");
  elements.arenaSelect = document.getElementById("arena-opponent");

  const [monsters, missions] = await Promise.all([
    loadYaml("../data/monsters.yaml"),
    loadYaml("../data/missions.yaml"),
  ]);
  state.monsters = monsters;
  state.missions = missions;

  elements.workSelect.innerHTML = state.rackets
    .map((job) => `<option value="${job.id}">${job.name}</option>`)
    .join("");

  renderDistricts();
  renderMissions();
  grantStarterTeam();
  renderResources();
  renderRackets();
  renderArena();

  elements.missionSelect.addEventListener("change", updateMissionDetails);
  elements.startMission.addEventListener("click", startMission);
  elements.captureBtn = document.getElementById("capture-btn");
  elements.captureBtn.addEventListener("click", captureAttempt);
  elements.addToTeamBtn = document.getElementById("add-to-team");
  elements.addToTeamBtn.addEventListener("click", addToTeam);
  elements.assignWorkBtn = document.getElementById("assign-work");
  elements.assignWorkBtn.addEventListener("click", assignWork);
  elements.arenaFightBtn = document.getElementById("fight-arena");
  elements.arenaFightBtn.addEventListener("click", startArenaBattle);
  elements.summonBtn = document.getElementById("summon-btn");
  elements.summonBtn.addEventListener("click", summonMonster);

  setInterval(regenTick, 5000);
  setInterval(tickActiveMission, 300);
  setInterval(tickWork, 1500);
  logEvent("Street intel and monster data loaded. Welcome to MonsterWars Idle!", "success");
}

window.addEventListener("DOMContentLoaded", init);
