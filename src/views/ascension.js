import { html } from '../lib/lit-html.js';
import { createSubmitHandler, popRate } from '../util.js';
import { icon } from './partials.js';

export function renderAscension(ctx) {
  const populationSettings = ctx.settings.population;
  const islandUrl = ctx.selection.island;

  if (!ctx.ascension[islandUrl]) {
    ctx.ascension[islandUrl] = {
      occident: 0,
      orient: 0,
      beggars: 0,
      beggarLvl: 0,
      envoys: 0,
      envoyLvl: 0,
    };
  }

  const ascension = ctx.ascension[islandUrl];

  update();

  function update() {
    const occident = calcAscension(populationSettings, 'occident', ascension);
    const orient = calcAscension(populationSettings, 'orient', ascension);

    ctx.render(
      ascensionTemplate(
        ascensionSection(occident),
        ascensionSection(orient),
        ascension,
        createSubmitHandler(onSubmit)
      )
    );
  }

  function onSubmit({
    occident,
    orient,
    beggars,
    beggarLvl,
    envoys,
    envoyLvl,
  }) {
    ascension.occident = occident;
    ascension.orient = orient;
    ascension.beggars = beggars;
    ascension.beggarLvl = beggarLvl;
    ascension.envoys = envoys;
    ascension.envoyLvl = envoyLvl;

    ctx.setAscension(ctx.ascension);

    update();
  }
}

//* @viktorpts for the complicated game logic calculation, and
//* actually tying it to the presentation layer

const ascensionTemplate = (occident, orient, data, onSubmit) => html`<h1>
    Ascension Pyramid
  </h1>
  <section class="main">
    <form @submit=${onSubmit} @input=${onSubmit}>
      <section>
        <h3>Occident</h3>
        ${occident(html`
            <tr>
                <td>${icon('peasant_house', 'dist')}</td>
                <td colspan="4"><input class="pop-input" name="occident" inputmode="number" .value=${
                  data.occident
                }>
                </td>
            </tr>
            <tr>
                <td>${icon('beggar', 'dist')}</td>
                <td colspan="4">
                    <div class="multi-input">
                        <input class="pop-input" name="beggars" inputmode="number" .value=${
                          data.beggars
                        }>
                    </div>
                    <div class="multi-level">
                        <label class="label">Beggar Prince</label>
                        <div class="label">
                            <input name="beggarLvl" type="radio" value="0" ?checked=${
                              data.beggarLvl == 0
                            }>
                            <input name="beggarLvl" type="radio" value="1" ?checked=${
                              data.beggarLvl == 1
                            }>
                            <input name="beggarLvl" type="radio" value="2" ?checked=${
                              data.beggarLvl == 2
                            }>
                            <input name="beggarLvl" type="radio" value="3" ?checked=${
                              data.beggarLvl == 3
                            }>
                        </div>
                    </div>
                </td>
            </tr>
            </tr>
            <tr>
                <td>${icon('envoy', 'dist')}</td>
                <td colspan="4">
                    <div class="multi-input">
                        <input class="pop-input" name="envoys" inputmode="number" .value=${
                          data.envoys
                        }>
                    </div>
                    <div class="multi-level">
                        <label class="label">Envoy's Favour</label>
                        <div class="label">
                            <input name="envoyLvl" type="radio" value="0" ?checked=${
                              data.envoyLvl == 0
                            }>
                            <input name="envoyLvl" type="radio" value="1" ?checked=${
                              data.envoyLvl == 1
                            }>
                            <input name="envoyLvl" type="radio" value="2" ?checked=${
                              data.envoyLvl == 2
                            }>
                            <input name="envoyLvl" type="radio" value="3" ?checked=${
                              data.envoyLvl == 3
                            }>
                        </div>
                    </div>
                </td>
            </tr>`)}
      </section>
      <section>
        <h3>Orient</h3>
        ${orient(html`<tr>
          <td>${icon('nomad_house', 'dist')}</td>
          <td colspan="2">
            <input
              class="pop-input"
              name="orient"
              inputmode="number"
              .value=${data.orient}
            />
          </td>
        </tr>`)}
      </section>
    </form>
  </section>`;

const ascensionSection = (distribution) => (form) =>
  html`<table>
      <thead>
        ${form}
        <tr class="wide">
          <th></th>
          ${distribution.map(
            (_, i, { length: l }) => html`<th>Level ${l - i}</th>`
          )}
        </tr>
      </thead>
      <tbody>
        ${distribution.map(ascensionRow)}
      </tbody>
    </table>
    <tr></tr>`;

const ascensionRow = ({ key, name, dist }) => html`<tr>
  <td>${icon(key, 'dist')}</td>
  ${[...dist].reverse().map(
    (v, i) => html`<td class=${i > 0 ? 'wide' : ''}>
      ${v.houses
        ? html` <span class="label">${v.houses}</span>
            <span class="label sub">${v.pop} ${name}</span>`
        : null}
    </td>`
  )}
</tr>`;

//! Please don't touch this
function calcAscension(popSettings, selectedType, ascension) {
  const selected = Object.entries(popSettings.ascension)
    .filter(([_, g]) => g.type == selectedType && g.level >= 0)
    .sort((a, b) => a[1].level - b[1].level);
  const index = Object.fromEntries(selected);
  const keys = selected.map(([n]) => n);
  const levels = keys.length;

  const matrix = [];

  const bonusCitizenships = Math.floor(
    ascension.beggars / popSettings.bonuses.beggarLvl[ascension.beggarLvl]
  );
  const bonusLicenses = Math.floor(
    ascension.envoys / popSettings.bonuses.envoyLvl[ascension.envoyLvl]
  );

  for (let level = 0; level < levels; level++) {
    const current = [];

    for (let popLevel = 0; popLevel < levels; popLevel++) {
      let value = null;
      if (popLevel <= level) {
        if (popLevel == 0) {
          value = ascension[selectedType];
        } else {
          value = popRate(current[popLevel - 1], index[keys[popLevel]].rate);
          if (selectedType == 'occident') {
            if (popLevel == 1) {
              value += bonusCitizenships || 0;
            } else if (popLevel == 2) {
              value += bonusLicenses || 0;
            }
            if (current[popLevel - 1] - value < 0) {
              value = current[popLevel - 1];
            }
          }
          current[popLevel - 1] -= value;
        }
      }
      current[popLevel] = value;
    }
    matrix[level] = current.map((v, i) => ({
      houses: v,
      pop: v && v * index[keys[i]].capacity,
    }));
  }

  const distribution = keys.map((key) => ({
    key,
    name: index[key].name,
    dist: [],
  }));
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      distribution[j].dist[i] = matrix[i][j];
    }
  }

  return distribution;
}
