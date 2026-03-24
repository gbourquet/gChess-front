import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TimeControlSelection } from '../../models/time-control.model';

@Component({
  selector: 'app-custom-time-control-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './custom-time-control-dialog.component.html',
})
export class CustomTimeControlDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CustomTimeControlDialogComponent>);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    totalTimeMinutes: [10, [Validators.required, Validators.min(1), Validators.max(180)]],
    incrementSeconds: [0, [Validators.required, Validators.min(0), Validators.max(60)]],
  });

  confirm(): void {
    if (this.form.invalid) return;
    const value = this.form.value;
    const selection: TimeControlSelection = {
      totalTimeMinutes: value.totalTimeMinutes!,
      incrementSeconds: value.incrementSeconds!,
    };
    this.dialogRef.close(selection);
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
