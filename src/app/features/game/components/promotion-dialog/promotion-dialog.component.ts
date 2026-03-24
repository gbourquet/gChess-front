import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PieceType } from '../../../../core/websocket/models';

/**
 * Promotion dialog component
 * Allows user to select promotion piece when pawn reaches the last rank
 */
@Component({
  selector: 'app-promotion-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './promotion-dialog.component.html',
  styleUrl: './promotion-dialog.component.css'
})
export class PromotionDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PromotionDialogComponent>);

  /**
   * Promotion options with display labels
   */
  promotionOptions: Array<{ type: PieceType; label: string; symbol: string }> = [
    { type: 'QUEEN', label: 'Reine', symbol: '♕' },
    { type: 'ROOK', label: 'Tour', symbol: '♖' },
    { type: 'BISHOP', label: 'Fou', symbol: '♗' },
    { type: 'KNIGHT', label: 'Cavalier', symbol: '♘' }
  ];

  /**
   * Select a promotion piece
   */
  selectPiece(pieceType: PieceType): void {
    this.dialogRef.close(pieceType);
  }

  /**
   * Cancel promotion (close dialog without selection)
   */
  cancel(): void {
    this.dialogRef.close(null);
  }
}
