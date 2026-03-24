import { Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ConnectionState } from '../../../core/websocket/models';

/**
 * WebSocket connection status indicator component
 */
@Component({
  selector: 'app-connection-indicator',
  standalone: true,
  imports: [MatChipsModule, MatIconModule],
  templateUrl: './connection-indicator.component.html',
  styleUrl: './connection-indicator.component.css'
})
export class ConnectionIndicatorComponent {
  // Input signal for connection state
  connectionState = input.required<ConnectionState>();

  /**
   * Get chip color based on connection state
   */
  getChipColor(): string {
    switch (this.connectionState()) {
      case 'connected':
        return 'primary';
      case 'connecting':
      case 'reconnecting':
        return 'accent';
      case 'disconnected':
        return 'basic';
      case 'failed':
        return 'warn';
      default:
        return 'basic';
    }
  }

  /**
   * Get icon based on connection state
   */
  getIcon(): string {
    switch (this.connectionState()) {
      case 'connected':
        return 'cloud_done';
      case 'connecting':
      case 'reconnecting':
        return 'cloud_sync';
      case 'disconnected':
        return 'cloud_off';
      case 'failed':
        return 'error';
      default:
        return 'help';
    }
  }

  /**
   * Get label text based on connection state
   */
  getLabel(): string {
    switch (this.connectionState()) {
      case 'connected':
        return 'Connecté';
      case 'connecting':
        return 'Connexion...';
      case 'reconnecting':
        return 'Reconnexion...';
      case 'disconnected':
        return 'Déconnecté';
      case 'failed':
        return 'Échec';
      default:
        return 'Inconnu';
    }
  }
}
