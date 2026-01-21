import { cardGameTest as test, expect } from '../../utils/card-game/fixtures/card.fixture';
import { testMo } from '../../utils/utilities';

test.describe('The Cards Game', () => {
  test('NavigateToWebsite_ItsUpAndRunning', async ({ cardsHomePage }) => {
    const step = testMo(test);
    await step('Navigate to website', async () => {
      await cardsHomePage.open();
    });

    await step('Verify page title and subtitle', async () => {
      await expect(cardsHomePage.title).toHaveText('Deck of Cards');
      await expect(cardsHomePage.subtitle).toHaveText('An API');
    });
  });

  test('CreateNewDeck_ItsCreatedAndNotShuffled', async ({ deckService }) => {
    const step = testMo(test);
    let res: Awaited<ReturnType<typeof deckService.newDeck>>;

    await step('Create new deck', async () => {
      res = await deckService.newDeck();
    });

    await step('Verify deck creation response', async () => {
      expect(res.response.ok()).toBeTruthy();
      expect(res.data?.success).toBeTruthy();
      expect(typeof res.data?.deck_id).toBe('string');
      expect(res.data?.deck_id).toMatch(/^[a-z0-9]+$/i);
      expect(res.data?.remaining).toBe(52);
      expect(res.data?.shuffled).toBe(false);
    });
  });

  test('ShuffleCards_ReturnCorrectDeckIdAndShuffledTrue', async ({ deckService }) => {
    const step = testMo(test);
    let created: Awaited<ReturnType<typeof deckService.newDeck>>;
    let id: string;
    let shuffled: Awaited<ReturnType<typeof deckService.shuffle>>;

    await step('Create new deck', async () => {
      created = await deckService.newDeck();
      id = created.data!.deck_id;
    });

    await step('Verify deck is not shuffled', async () => {
      expect(created.response.ok()).toBeTruthy();
      expect(created.data?.shuffled).toBe(false);
    });

    await step('Shuffle the deck', async () => {
      shuffled = await deckService.shuffle(id);
    });

    await step('Verify deck is shuffled with correct ID', async () => {
      expect(shuffled.response.ok()).toBeTruthy();
      expect(shuffled.data?.deck_id).toBe(id);
      expect(shuffled.data?.shuffled).toBe(true);
    });
  });

  test('(e2e)_Distributes2CardsToEachPlayer_CheckForBlakjack', async ({ roundEngine }) => {
    const step = testMo(test);
    let newDeck: Awaited<ReturnType<typeof roundEngine.startRound>>['newDeck'];
    let shuffle: Awaited<ReturnType<typeof roundEngine.startRound>>['shuffle'];
    let deal: Awaited<ReturnType<typeof roundEngine.dealInitial>>;
    let hands: ReturnType<typeof roundEngine.getHands>;
    let summary: ReturnType<typeof roundEngine.summarizeAndLog>;

    await step('Start round and shuffle deck', async () => {
      ({ newDeck, shuffle } = await roundEngine.startRound());
    });

    await step('Verify round started successfully', async () => {
      expect(newDeck.response.ok()).toBeTruthy();
      expect(shuffle?.response.ok()).toBeTruthy();
    });

    await step('Deal initial cards', async () => {
      deal = await roundEngine.dealInitial();
    });

    await step('Verify 4 cards were dealt', async () => {
      expect(deal.response.ok()).toBeTruthy();
      expect(deal.data?.cards?.length).toBe(4);
    });

    await step('Get player hands', async () => {
      hands = roundEngine.getHands();
    });

    await step('Verify each player has 2 cards', async () => {
      expect(hands.P1.length).toBe(2);
      expect(hands.P2.length).toBe(2);
    });

    await step('Summarize and log round', async () => {
      summary = roundEngine.summarizeAndLog();
    });

    await step('Verify round summary', async () => {
      expect(summary.deckId).toEqual(newDeck.data?.deck_id ?? 'unknown');
      expect(summary.players.length).toBe(2);

      for (const p of summary.players) {
        expect(Array.isArray(p.codes)).toBe(true);
        expect(p.codes.length).toBe(2);
        expect(typeof p.score).toBe('number');
        expect(typeof p.isSoft).toBe('boolean');
        expect(typeof p.isBust).toBe('boolean');
        expect(typeof p.isBlackjack).toBe('boolean');
      }
    });
  });

  test('(e2e)_IfNoNaturalsBlackjack_PlayersHitOneMoreTime_CheckWhoWins', async ({
    roundEngine,
  }) => {
    const step = testMo(test);
    let newDeck: Awaited<ReturnType<typeof roundEngine.startRound>>['newDeck'];
    let shuffle: Awaited<ReturnType<typeof roundEngine.startRound>>['shuffle'];
    let deal: Awaited<ReturnType<typeof roundEngine.dealInitial>>;
    let naturals: ReturnType<typeof roundEngine.hasNaturalBlackjack>;
    let hit1: Awaited<ReturnType<typeof roundEngine.hit>>;
    let hit2: Awaited<ReturnType<typeof roundEngine.hit>>;
    let hands: ReturnType<typeof roundEngine.getHands>;
    let expectedLen: number;
    let summary: ReturnType<typeof roundEngine.summarizeAndLog>;

    await step('Start round and shuffle deck', async () => {
      ({ newDeck, shuffle } = await roundEngine.startRound());
    });

    await step('Verify round started successfully', async () => {
      expect(newDeck.response.ok()).toBeTruthy();
      expect(shuffle?.response.ok()).toBeTruthy();
    });

    await step('Deal initial cards', async () => {
      deal = await roundEngine.dealInitial();
    });

    await step('Verify cards were dealt', async () => {
      expect(deal.response.ok()).toBeTruthy();
    });

    await step('Check for natural blackjack', async () => {
      naturals = roundEngine.hasNaturalBlackjack();
    });

    await step('Players hit if no natural blackjack', async () => {
      //This if here to follow the natural blackjack logic
      if (!naturals.P1 && !naturals.P2) {
        hit1 = await roundEngine.hit('P1');
        hit2 = await roundEngine.hit('P2');
        expect(hit1.response.ok()).toBeTruthy();
        expect(hit2.response.ok()).toBeTruthy();
      }
    });

    await step('Get player hands', async () => {
      hands = roundEngine.getHands();
      expectedLen = !naturals.P1 && !naturals.P2 ? 3 : 2;
    });

    await step('Verify hand sizes', async () => {
      expect(hands.P1.length).toBe(expectedLen);
      expect(hands.P2.length).toBe(expectedLen);
    });

    await step('Summarize and verify final scores', async () => {
      summary = roundEngine.summarizeAndLog();
      for (const p of summary.players) {
        expect(p.codes.length).toBe(expectedLen);
        expect(typeof p.score).toBe('number');
      }
    });
  });
});
