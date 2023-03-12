import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { AttackerInfo, DefenderInfo } from 'src/app/models/combat-info.model';
import { Ruleset } from 'src/app/models/ruleset.model';

export interface CombatSimulatorState {
    attacker: AttackerInfo | null;
    defender: DefenderInfo | null;
    ruleset: Ruleset | null;
}

const initialState: CombatSimulatorState = {
    attacker: null,
    defender: null,
    ruleset: null
};

// eslint-disable-next-line @angular-eslint/use-injectable-provided-in -- not needed in component stores
@Injectable()
export class CombatSimulatorStore extends ComponentStore<CombatSimulatorState> {
    constructor() {
        super(initialState);
    }
}
