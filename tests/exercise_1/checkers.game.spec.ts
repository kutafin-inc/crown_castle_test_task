import { checkersTest as test, expect } from '../../utils/checkers-game/fixtures/checkers.fixture';
import { pieceAt, countPieces } from '../../utils/checkers-game/helpers/board.parser';
import { MY_MOVES, OPPONENT_MOVES } from '../../utils/checkers-game/helpers/hardcoded.scenario';
import { testMo } from '../../utils/utilities';
import type { Board, Move } from '../../utils/checkers-game/helpers/board.types';

test.describe('The Checkers Game', () => {
  test.beforeEach(async ({ checkersPage }) => {
    await test.step('Navigate to website', async () => {
      await checkersPage.goto();
    });
  });

  test('NavigateToWebsite_IsUpAndRunning', async ({ checkersPage }) => {
    const step = testMo(test);
    let board: Board;
    let counts: { orange: number; blue: number };

    await step('Navigate to website and verify initial state', async () => {
      board = await checkersPage.readBoard();
    });

    await step('Count pieces', async () => {
      counts = countPieces(board);
    });

    await step('Assert that game is in initial state', async () => {
      await expect(checkersPage.page).toHaveTitle('Checkers - Games for the Brain');
      await expect(checkersPage.makeMoveText).toHaveText('Select an orange piece to move.');
      await expect(checkersPage.board).toBeVisible();
      expect(counts).toEqual({ orange: 12, blue: 12 });
    });
  });

  test('FirstPlayersMove_PieceAtCorrectDestination', async ({ checkersPage }) => {
    const step = testMo(test);
    const myMove: Move = MY_MOVES[0];
    let board: Board;

    await step('Make move', async () => {
      await checkersPage.makeMove(myMove);
      await checkersPage.waitForOpponentMoveToFinish(OPPONENT_MOVES[0].r, OPPONENT_MOVES[0].c);
    });

    await step('Verify piece moved', async () => {
      board = await checkersPage.readBoard();
    });

    await step('Assert that piece moved to correct destination', async () => {
      const pieceAtStart = pieceAt(board, myMove.from.r, myMove.from.c);
      const pieceAtDestination = pieceAt(board, myMove.to.r, myMove.to.c);
      expect(pieceAtStart).not.toBe('orange');
      expect(pieceAtDestination).toBe('orange');
    });
  });

  test('RestartTheGame_NewGameIsOnTheScreen', async ({ checkersPage }) => {
    const step = testMo(test);
    let board: Board | null;
    let textBefore: String | null;
    let counts: { orange: number; blue: number };

    await step('Make move', async () => {
      await checkersPage.makeMove(MY_MOVES[0]);
      await checkersPage.waitForOpponentMoveToFinish(OPPONENT_MOVES[0].r, OPPONENT_MOVES[0].c);
    });

    await step('Restart the game', async () => {
      textBefore = await checkersPage.getStatusText();
      await checkersPage.restartGame();
    });

    await step('Assert that new game is on the screen', async () => {
      board = await checkersPage.readBoard();
      counts = countPieces(board);
      expect(counts).toEqual({ orange: 12, blue: 12 });
      expect(textBefore).toBe('Make a move.');
      await expect(checkersPage.makeMoveText).toHaveText(/Select an orange piece to move./i);
    });
  });

  test('(e2e)_Make5LegalMovesAndRestart', async ({ checkersPage }) => {
    const step = testMo(test);
    let after4: { orange: number; blue: number };
    let after5: { orange: number; blue: number };
    let board: Board;
    let counts: { orange: number; blue: number };

    await step('Make move 1 and wait for opponent', async () => {
      await checkersPage.makeMove(MY_MOVES[0]);
      await checkersPage.waitForOpponentMoveToFinish(OPPONENT_MOVES[0].r, OPPONENT_MOVES[0].c);
    });

    await step('Make move 2 and wait for opponent', async () => {
      await checkersPage.makeMove(MY_MOVES[1]);
      await checkersPage.waitForOpponentMoveToFinish(OPPONENT_MOVES[1].r, OPPONENT_MOVES[1].c);
    });

    await step('Make move 3 and wait for opponent', async () => {
      await checkersPage.makeMove(MY_MOVES[2]);
      await checkersPage.waitForOpponentMoveToFinish(OPPONENT_MOVES[2].r, OPPONENT_MOVES[2].c);
    });

    await step('Make move 4 and wait for opponent', async () => {
      await checkersPage.makeMove(MY_MOVES[3]);
      await checkersPage.waitForOpponentMoveToFinish(OPPONENT_MOVES[3].r, OPPONENT_MOVES[3].c);
    });

    await step('Count pieces after move 4', async () => {
      after4 = await checkersPage.readCounts();
    });

    await step('Make move 5 and wait for opponent', async () => {
      await checkersPage.makeMove(MY_MOVES[4]);
      await checkersPage.waitForOpponentMoveToFinish(OPPONENT_MOVES[4].r, OPPONENT_MOVES[4].c);
    });

    await step('Count pieces after move 5', async () => {
      after5 = await checkersPage.readCounts();
    });

    await step('Assert piece counts after moves 4 and 5', async () => {
      // Expect after move 4 Orange has lost 1, after move 5 Blue has lost 1
      expect.soft(after4.orange).toBe(11);
      expect.soft(after4.blue).toBe(11);
      expect.soft(after5.orange).toBe(10);
      expect.soft(after5.blue).toBe(10);
    });

    await step('Restart the game', async () => {
      await checkersPage.restartGame();
    });

    await step('Verify game returned to initial state', async () => {
      board = await checkersPage.readBoard();
      counts = countPieces(board);
      expect(counts).toEqual({ orange: 12, blue: 12 });
    });
  });

  test.afterAll(async ({ browser }) => {
    await test.step('Close browser', async () => {
      await browser.close();
    });
  });
});
