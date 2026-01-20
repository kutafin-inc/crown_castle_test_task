import type { Board, Square } from './board.types';

// Checking if this square is playable (even/odd row )
export function isPlayable(r: number, c: number) : boolean {
  return (r + c) % 2 === 0;
}

export function pieceFromSrc(src: string): { piece: Square['piece']; king: boolean } {
  const s = src.toLowerCase();
  const isOrange = s.includes('you');
  const isBlue = s.includes('me');
  const king = s.includes('2'); // you2/me2
  return {
    piece: isOrange ? 'orange' : isBlue ? 'blue' : null,
    king,
  };
}

export function emptyBoard(): Board {
  const rows: Board = [] as unknown as Board;
  for (let r = 1; r <= 8; r++) {
    const row: Square[] = [];
    for (let c = 1; c <= 8; c++) {
      row.push({ r, c, playable: isPlayable(r, c), piece: null, king: false });
    }
    rows.push(row);
  }
  return rows;
}

// Partial means you can pass only the Square fields you want to update (e.g., just piece and king), not the whole Square
// DOM is 0-based, board is 1-based, way more convenient to use 1-based
export function setSquare(board: Board, r: number, c: number, square: Partial<Square>) : void {
  const sq = board[r - 1][c - 1];
  Object.assign(sq, square);
}

export function pieceAt(board: Board, r: number, c: number): "orange" | "blue" | null {
  return board[r - 1][c - 1]?.piece ?? null;
}

export function countPieces(board: Board): { orange: number; blue: number } {
  let orange = 0,
    blue = 0;

  for (const row of board)
    for (const sq of row) {
      if (sq.piece === 'orange') orange++;
      else if (sq.piece === 'blue') blue++;
    }

  return { orange, blue };
}
