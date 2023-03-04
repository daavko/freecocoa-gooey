import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppFacade, AppScreen } from 'src/app/state/app/public-api';
import { map, Observable } from 'rxjs';
import { RulesetFacade } from 'src/app/state/ruleset/public-api';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    public readonly screen$: Observable<AppScreen>;
    public readonly showBackToRulesetButton$: Observable<boolean>;
    public readonly showBackToUtilityPickerButton: Observable<boolean>;

    constructor(private appFacade: AppFacade, private rulesetFacade: RulesetFacade) {
        this.screen$ = appFacade.screen$;
        this.showBackToRulesetButton$ = appFacade.screen$.pipe(map((screen) => screen === 'utilPick'));
        this.showBackToUtilityPickerButton = appFacade.screen$.pipe(map((screen) => screen === 'combatForm'));
    }

    public backToRulesetSelection(): void {
        this.appFacade.switchScreen('rulesetPick');
        this.rulesetFacade.reset();
    }

    public backToUtilSelection(): void {
        this.appFacade.switchScreen('utilPick');
    }
}
