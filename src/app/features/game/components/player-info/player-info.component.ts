import { Component, input, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Color } from '../../../../core/websocket/models';
import { PlayerInfo } from '../../models';

/**
 * Player information component
 * Displays player name, color, and connection status
 */
@Component({
  selector: 'app-player-info',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule, CommonModule],
  templateUrl: './player-info.component.html',
  styleUrl: './player-info.component.css'
})
export class PlayerInfoComponent {
  // Inputs
  player = input.required<PlayerInfo>();
  color = input.required<Color>();
  isCurrentPlayer = input<boolean>(false);

  /**
   * Get color label
   */
  getColorLabel(): string {
    return this.color() === 'WHITE' ? 'Blancs' : 'Noirs';
  }

  /**
   * Get connection status label
   */
  getConnectionLabel(): string {
    return this.player().isConnected ? 'En ligne' : 'Déconnecté';
  }

  /**
   * Get connection icon
   */
  getConnectionIcon(): string {
    return this.player().isConnected ? 'signal_wifi_4_bar' : 'signal_wifi_off';
  }

  /**
   * Get piece unicode character
   * Shows captured pieces in their actual color (white pieces = white, black pieces = black)
   */
  getPieceUnicode(piece: 'pawns' | 'rooks' | 'knights' | 'bishops' | 'queens'): string {
    const isWhite = this.color() === 'WHITE';
    const pieces = {
      pawns: isWhite ? '♙' : '♟',
      rooks: isWhite ? '♖' : '♜',
      knights: isWhite ? '♘' : '♞',
      bishops: isWhite ? '♗' : '♝',
      queens: isWhite ? '♕' : '♛'
    };
    return pieces[piece];
  }

  /**
   * Check if player has captured any pieces
   */
  hasCapturedPieces = computed(() => {
    const captured = this.player().capturedPieces;
    if (!captured) return false;
    return captured.pawns > 0 || captured.rooks > 0 ||
           captured.knights > 0 || captured.bishops > 0 ||
           captured.queens > 0;
  });

  /**
   * Get an array of specified length for ngFor
   */
  getRepeatedArray(count: number): number[] {
    return Array(count).fill(0);
  }
}
