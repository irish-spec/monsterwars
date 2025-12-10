const state = {
  monsters: [],
  missions: [],
  collection: [],
  team: [],
  activeMission: null,
  player: {
    cash: 750,
    heat: 0,
    captureKits: 3,
    stamina: 18,
    staminaMax: 20,
  },
};

const elements = {};

async function loadYaml(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  const text = await response.text();
  return jsyaml.load(text);
}

function formatRewards(rewards) {
  const parts = [];
  if (!rewards) return "None listed";
  if (rewards.cash) parts.push(`$${rewards.cash}`);
  if (rewards.dna_shards) {
    parts.push(`${rewards.dna_shards.amount} ${rewards.dna_shards.affinity} DNA`);
  }
  if (rewards.gear_components) parts.push(`${rewards.gear_components} gear comp`);
  return parts.join(" · ") || "Mystery";
}

function updateMissionDetails() {
  const select = elements.missionSelect;
  const mission = state.missions.find((m) => m.id === select.value);
  if (!mission) return;
  elements.missionStamina.textContent = mission.stamina_cost;
  elements.missionPower.textContent = mission.recommended_power;
  elements.missionRewards.textContent = formatRewards(mission.rewards);
}

function logEvent(text, type = "info") {
  const item = document.createElement("li");
  item.textContent = text;
  if (type === "success") item.classList.add("success");
  if (type === "fail") item.classList.add("fail");
  elements.log.prepend(item);
  while (elements.log.children.length > 60) {
    elements.log.removeChild(elements.log.lastChild);
  }
}

function calculateTeamPower() {
  return state.team.reduce((total, monster) => {
    const { hp = 0, attack = 0, special = 0, defense = 0, speed = 0, grit = 0 } = monster.stats || {};
    return total + hp * 0.25 + attack * 0.8 + special * 0.7 + defense * 0.4 + speed * 0.6 + grit * 1.2;
  }, 0);
}

function renderResources() {
  elements.cash.textContent = Math.floor(state.player.cash);
  elements.heat.textContent = state.player.heat;
  elements.captureKits.textContent = state.player.captureKits;
  elements.stamina.textContent = state.player.stamina;
  elements.staminaMax.textContent = state.player.staminaMax;
  elements.teamPower.textContent = Math.round(calculateTeamPower());
}

function renderTeam() {
  elements.teamSlots.innerHTML = "";
  for (let i = 0; i < 3; i += 1) {
    const slot = document.createElement("div");
    slot.className = "team-slot";
    const monster = state.team[i];
    if (monster) {
      slot.innerHTML = `<h4>${monster.name}</h4><p>${monster.affinity} ${monster.role}</p><p>Grit ${monster.stats?.grit ?? 0} · Spd ${monster.stats?.speed ?? 0}</p>`;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.className = "secondary";
      removeBtn.addEventListener("click", () => {
        state.team.splice(i, 1);
        renderTeam();
        renderResources();
      });
      slot.appendChild(removeBtn);
    } else {
      slot.innerHTML = `<h4>Empty Slot</h4><p>Drop in a captured monster.</p>`;
    }
    elements.teamSlots.appendChild(slot);
  }
}

function renderCollectionSelects() {
  const options = state.collection.map((m) => `<option value="${m.id}">${m.name} (${m.affinity})</option>`);
  elements.monsterSelect.innerHTML = options.join("");
  elements.collectionSelect.innerHTML = `<option value="">-- choose --</option>${options.join("")}`;
}

function grantStarterTeam() {
  state.collection = state.monsters.slice(0, 3);
  state.team = state.collection.slice(0, 2);
  logEvent("You start with a couple of streetwise beasts to keep you safe.", "success");
  renderCollectionSelects();
  renderTeam();
}

function regenTick() {
  if (state.player.stamina < state.player.staminaMax) {
    state.player.stamina = Math.min(state.player.staminaMax, state.player.stamina + 1);
  }
  state.player.cash += 6; // idle drip
  state.player.heat = Math.max(0, state.player.heat - 1);
  renderResources();
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

  state.player.stamina -= mission.stamina_cost;
  state.player.heat += 2;
  const duration = 5000 + Math.max(0, mission.recommended_power - calculateTeamPower()) * 10;
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
    logEvent(`${mission.name} succeeded! Earned $${cashReward}.`, "success");
    // chance to trigger encounter capture
    const monsterEncounter = mission.encounters?.find((e) => e.type === "monster");
    if (monsterEncounter && Math.random() < 0.4) {
      const targetId = monsterEncounter.enemy_team?.[0];
      const monster = state.monsters.find((m) => m.id === targetId);
      if (monster) {
        state.collection.push(monster);
        logEvent(`Found intel and lured ${monster.name} to join your stable!`, "success");
      }
    }
  } else {
    state.player.heat += 3;
    logEvent(`${mission.name} was botched. Lay low and recover.`, "fail");
  }
  renderCollectionSelects();
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
  const monster = state.monsters.find((m) => m.id === elements.monsterSelect.value);
  if (!monster) return;
  if (state.player.captureKits <= 0) {
    logEvent("No capture kits left. Run missions to earn more.", "fail");
    return;
  }
  state.player.captureKits -= 1;
  const baseChance = 0.3 + (monster.stats?.loyalty ?? 0) / 120;
  const heatMod = Math.max(0.1, 1 - state.player.heat * 0.02);
  const finalChance = Math.min(0.9, baseChance * heatMod);
  const roll = Math.random();
  if (roll < finalChance) {
    state.collection.push(monster);
    logEvent(`Captured ${monster.name}! Heat eased after the win.`, "success");
    state.player.heat = Math.max(0, state.player.heat - 2);
    renderCollectionSelects();
  } else {
    state.player.heat += 2;
    logEvent(`${monster.name} slipped away. Heat increased.`, "fail");
  }
  renderResources();
}

function addToTeam() {
  const id = elements.collectionSelect.value;
  if (!id) return;
  const monster = state.collection.find((m) => m.id === id);
  if (!monster) return;
  if (state.team.length >= 3) {
    logEvent("Team is full. Remove someone first.");
    return;
  }
  state.team.push(monster);
  renderTeam();
  renderResources();
}

async function init() {
  elements.cash = document.getElementById("cash");
  elements.heat = document.getElementById("heat");
  elements.captureKits = document.getElementById("capture-kits");
  elements.stamina = document.getElementById("stamina");
  elements.staminaMax = document.getElementById("stamina-max");
  elements.teamPower = document.getElementById("team-power");
  elements.missionSelect = document.getElementById("mission-select");
  elements.missionStamina = document.getElementById("mission-stamina");
  elements.missionPower = document.getElementById("mission-power");
  elements.missionRewards = document.getElementById("mission-rewards");
  elements.startMission = document.getElementById("start-mission");
  elements.activeMission = document.getElementById("active-mission");
  elements.activeMissionText = document.getElementById("active-mission-text");
  elements.missionProgress = document.getElementById("mission-progress");
  elements.log = document.getElementById("log");
  elements.monsterSelect = document.getElementById("monster-select");
  elements.collectionSelect = document.getElementById("collection-select");
  elements.teamSlots = document.getElementById("team-slots");

  const [monsters, missions] = await Promise.all([
    loadYaml("../data/monsters.yaml"),
    loadYaml("../data/missions.yaml"),
  ]);
  state.monsters = monsters;
  state.missions = missions;

  elements.missionSelect.innerHTML = missions
    .map((m) => `<option value="${m.id}">${m.name} (${m.district})</option>`)
    .join("");
  updateMissionDetails();
  grantStarterTeam();
  renderResources();

  elements.missionSelect.addEventListener("change", updateMissionDetails);
  elements.startMission.addEventListener("click", startMission);
  elements.captureBtn = document.getElementById("capture-btn");
  elements.captureBtn.addEventListener("click", captureAttempt);
  elements.addToTeamBtn = document.getElementById("add-to-team");
  elements.addToTeamBtn.addEventListener("click", addToTeam);

  setInterval(regenTick, 5000);
  setInterval(tickActiveMission, 300);
  logEvent("Street intel and monster data loaded. Welcome to MonsterWars Idle!", "success");
}

window.addEventListener("DOMContentLoaded", init);
