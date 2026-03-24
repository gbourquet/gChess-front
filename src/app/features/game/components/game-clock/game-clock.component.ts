import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Game clock component
 * Displays remaining time for one player with color feedback.
 * Pure presentational component — receives pre-computed ms value.
 */
@Component({
  selector: 'app-game-clock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-clock.component.html',
  styleUrl: './game-clock.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameClockComponent {
  remainingMs = input<number | null>(null);
  isActive = input<boolean>(false);

  displayTime = computed(() => {
    const ms = this.remainingMs();
    if (ms === null) return '--:--';
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  colorClass = computed(() => {
    const ms = this.remainingMs();
    if (ms === null) return '';
    if (ms <= 10_000) return 'clock-critical';
    if (ms <= 60_000) return 'clock-warning';
    return '';
  });

  isPulsing = computed(() => {
    const ms = this.remainingMs();
    return this.isActive() && ms !== null && ms <= 5_000;
  });
}
