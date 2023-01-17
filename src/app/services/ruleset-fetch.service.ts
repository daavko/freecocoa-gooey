import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, Observable } from 'rxjs';
import { Ruleset } from 'src/app/models/ruleset.model';
import { RulesetParserService } from 'src/app/services/ruleset-parser.service';
import { FreecivIniLexer } from 'src/app/services/parser/parser-constants';
import { FreecivIniParser } from 'src/app/services/parser/freeciv-ini-parser';

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
                console.time('PARSER');
                const parser = new FreecivIniParser();
                try {
                    const parsedUnits = FreecivIniLexer.tokenize(units);
                    console.log('Lexed units', parsedUnits);
                    parser.input = parsedUnits.tokens;
                    const out = parser.IniContents();
                    console.log('Parsed units', out, parser.errors);
                } catch (e) {
                    console.error('Unable to parse units with Chevrotain', e);
                }
                try {
                    const parsedTerrain = FreecivIniLexer.tokenize(terrain);
                    console.log('Lexed terrain', parsedTerrain);
                    parser.input = parsedTerrain.tokens;
                    const out = parser.IniContents();
                    console.log('Parsed terrain', out, parser.errors);
                } catch (e) {
                    console.error('Unable to parse terrain with Chevrotain', e);
                }
                try {
                    const parsedEffects = FreecivIniLexer.tokenize(effects);
                    console.log('Lexed effects', parsedEffects);
                    parser.input = parsedEffects.tokens;
                    const out = parser.IniContents();
                    console.log('Parsed effects', out, parser.errors);
                } catch (e) {
                    console.error('Unable to parse effects with Chevrotain', e);
                }
                console.timeEnd('PARSER');

                console.time('MANUAL_P');
                const [unitTypes, unitClasses, defaultVeteranLevels] = this.rulesetParser.parseUnits(units);
                const [terrainTypes, moveFrags] = this.rulesetParser.parseTerrain(terrain);
                const effectsList = this.rulesetParser.parseEffects(effects);
                console.timeEnd('MANUAL_P');
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
