import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, Observable } from 'rxjs';
import { Ruleset } from 'src/app/models/ruleset.model';
import { RulesetParserService } from 'src/app/services/ruleset-parser.service';

@Injectable({
    providedIn: 'root'
})
export class RulesetFetchService {
    constructor(private http: HttpClient, private rulesetParser: RulesetParserService) {}

    public fetchRuleset(effectsUrl: string, terrainUrl: string, unitsUrl: string): Observable<Ruleset> {
        const effects$ = this.http.get(effectsUrl, { responseType: 'text' });
        const terrain$ = this.http.get(terrainUrl, { responseType: 'text' });
        const units$ = this.http.get(unitsUrl, { responseType: 'text' });
        return combineLatest([units$, terrain$, effects$]).pipe(
            map(([units, terrain, effects]) => {
                const [unitTypes, unitClasses, defaultVeteranLevels] = this.rulesetParser.parseUnits(units);
                const [terrainTypes, moveFrags] = this.rulesetParser.parseTerrain(terrain);
                const effectsList = this.rulesetParser.parseEffects(effects);
                return {
                    effects: effectsList,
                    unitTypes,
                    unitClasses,
                    defaultVeteranLevels,
                    terrainTypes,
                    moveFrags
                };
            })
        );
    }
}
