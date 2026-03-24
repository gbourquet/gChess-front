import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../core/auth/services/auth.service';
import {
  TIME_CONTROL_PRESETS,
  CATEGORY_LABELS,
  TimeControlPreset,
  TimeControlSelection,
} from '../../models/time-control.model';
import { CustomTimeControlDialogComponent } from '../../components/custom-time-control-dialog/custom-time-control-dialog.component';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.css',
})
export class LobbyComponent {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  readonly authService = inject(AuthService);

  readonly categories: TimeControlPreset['category'][] = ['bullet', 'blitz', 'rapid', 'classical'];
  readonly categoryLabels = CATEGORY_LABELS;

  presetsByCategory(category: TimeControlPreset['category']): TimeControlPreset[] {
    return TIME_CONTROL_PRESETS.filter(p => p.category === category);
  }

  onPresetSelect(preset: TimeControlPreset): void {
    this.navigateToMatchmaking(preset.totalTimeMinutes, preset.incrementSeconds);
  }

  onCustomGame(): void {
    const dialogRef = this.dialog.open(CustomTimeControlDialogComponent, {
      width: '360px',
    });
    dialogRef.afterClosed().subscribe((selection: TimeControlSelection | undefined) => {
      if (selection) {
        this.navigateToMatchmaking(selection.totalTimeMinutes, selection.incrementSeconds);
      }
    });
  }

  private navigateToMatchmaking(totalTimeMinutes: number, incrementSeconds: number): void {
    this.router.navigate(['/matchmaking'], {
      state: {
        totalTimeMinutes,
        incrementSeconds,
      },
    });
  }
}
