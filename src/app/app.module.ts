import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RulesetPickerComponent } from './components/ruleset-picker/ruleset-picker.component';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttackerFormComponent } from './components/attacker-form/attacker-form.component';
import { DefenderFormComponent } from './components/defender-form/defender-form.component';

@NgModule({
    declarations: [AppComponent, RulesetPickerComponent, AttackerFormComponent, DefenderFormComponent],
    imports: [
        BrowserModule,
        HttpClientModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatButtonModule,
        MatInputModule,
        MatCheckboxModule,
        MatSliderModule,
        MatProgressSpinnerModule
    ],
    providers: [{ provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }],
    bootstrap: [AppComponent]
})
export class AppModule {}
