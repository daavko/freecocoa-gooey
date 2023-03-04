import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { RulesetPresetName, rulesetPresets } from 'src/app/models/ruleset-picker.model';
import { RulesetFetchService } from 'src/app/services/ruleset-fetch.service';
import { CombatCalculationService } from 'src/app/services/combat-calculation.service';
import { RulesetFacade } from 'src/app/state/ruleset/public-api';
import { LoadingState } from 'src/app/utils/utility-types';
import { isValidUrl, noGithubComUrl } from 'src/app/utils/form-utils';

@Component({
    selector: 'app-ruleset-picker',
    templateUrl: './ruleset-picker.component.html',
    styleUrls: ['./ruleset-picker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RulesetPickerComponent implements OnInit {
    public pickerForm = new FormGroup({
        preset: new FormControl<RulesetPresetName>({ value: 'none', disabled: false }),
        baseUrl: new FormControl<string>({ value: '', disabled: false }, [
            Validators.required,
            isValidUrl,
            noGithubComUrl
        ])
    });
    public readonly readonlyInputs$: Observable<boolean>;

    public readonly loadState$: Observable<LoadingState>;

    constructor(
        private rulesetFacade: RulesetFacade,
        private rulesetFetch: RulesetFetchService,
        private combatCalculator: CombatCalculationService
    ) {
        this.loadState$ = this.rulesetFacade.rulesetLoadingState$;
        this.readonlyInputs$ = combineLatest([this.pickerForm.controls.preset.valueChanges, this.loadState$]).pipe(
            map(([formValue, loadState]) => formValue !== 'none' || loadState === 'loading')
        );

        // todo: rewrite so calculator isn't used directly
        this.rulesetFacade.ruleset$.subscribe((ruleset) => this.combatCalculator.setRuleset(ruleset));
    }

    public ngOnInit(): void {
        this.pickerForm.controls.preset.valueChanges.subscribe((value) => {
            if (value !== null) {
                const { baseUrl } = rulesetPresets[value];
                this.pickerForm.controls.baseUrl.setValue(baseUrl);
            }
        });
    }

    public loadRuleset(): void {
        const { baseUrl } = this.pickerForm.getRawValue();

        if (baseUrl === null) {
            throw new Error('this should never happen');
        }

        this.rulesetFacade.loadRuleset(baseUrl);
    }

    public isInvalid(control: AbstractControl): boolean {
        return control.touched && control.invalid;
    }

    public getError(control: AbstractControl): string {
        if (control.hasError('required')) {
            return 'Value must not be empty';
        } else if (control.hasError('invalidUrl')) {
            return control.getError('invalidUrl') as string;
        } else if (control.hasError('noGithubComUrl')) {
            return control.getError('noGithubComUrl') as string;
        } else {
            return '';
        }
    }
}
