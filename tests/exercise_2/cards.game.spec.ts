import { cardGameTest as test, expect } from '../../utils/card-game/fixtures/card.fixture';

test.describe('The Cards Game', () => {
  test('NavigateToWebsite_ItsUpAndRunning', async ({ cardsHomePage }) => {
    await test.step('Navigate to website', async () => {
      await cardsHomePage.open();
    });

    await test.step('Verify page title and subtitle', async () => {
      await expect(cardsHomePage.title).toHaveText('Deck of Cards');
      await expect(cardsHomePage.subtitle).toHaveText('An API');
    });
  });

  test('CreateNewDeck_ItsCreatedAndNotShuffled', async ({ deckService }) => {
    let res: Awaited<ReturnType<typeof deckService.newDeck>>;

    await test.step('Create new deck', async () => {
      res = await deckService.newDeck();
    });

    await test.step('Verify deck creation response', () => {
      expect(res.response.ok()).toBeTruthy();
      expect(res.data?.success).toBeTruthy();
      expect(typeof res.data?.deck_id).toBe('string');
      expect(res.data?.deck_id).toMatch(/^[a-z0-9]+$/i);
      expect(res.data?.remaining).toBe(52);
      expect(res.data?.shuffled).toBe(false);
    });
  });

  test('ShuffleCards_ReturnCorrectDeckIdAndShuffledTrue', async ({ deckService }) => {
    let created: Awaited<ReturnType<typeof deckService.newDeck>>;
    let id: string;
    let shuffled: Awaited<ReturnType<typeof deckService.shuffle>>;

    await test.step('Create new deck', async () => {
      created = await deckService.newDeck();
      id = created.data!.deck_id;
    });

    await test.step('Verify deck is not shuffled', () => {
      expect(created.response.ok()).toBeTruthy();
      expect(created.data?.shuffled).toBe(false);
    });

    await test.step('Shuffle the deck', async () => {
      shuffled = await deckService.shuffle(id);
    });

    await test.step('Verify deck is shuffled with correct ID', () => {
      expect(shuffled.response.ok()).toBeTruthy();
      expect(shuffled.data?.deck_id).toBe(id);
      expect(shuffled.data?.shuffled).toBe(true);
    });
  });

  test('(e2e)_Distributes2CardsToEachPlayer_CheckForBlakjack', async ({ roundEngine }) => {
    let newDeck: Awaited<ReturnType<typeof roundEngine.startRound>>['newDeck'];
    let shuffle: Awaited<ReturnType<typeof roundEngine.startRound>>['shuffle'];
    let deal: Awaited<ReturnType<typeof roundEngine.dealInitial>>;
    let hands: ReturnType<typeof roundEngine.getHands>;
    let summary: ReturnType<typeof roundEngine.summarizeAndLog>;

    await test.step('Start round and shuffle deck', async () => {
      ({ newDeck, shuffle } = await roundEngine.startRound());
    });

    await test.step('Verify round started successfully', () => {
      expect(newDeck.response.ok()).toBeTruthy();
      expect(shuffle?.response.ok()).toBeTruthy();
    });

    await test.step('Deal initial cards', async () => {
      deal = await roundEngine.dealInitial();
    });

    await test.step('Verify 4 cards were dealt', () => {
      expect(deal.response.ok()).toBeTruthy();
      expect(deal.data?.cards?.length).toBe(4);
    });

    await test.step('Get player hands', () => {
      hands = roundEngine.getHands();
    });

    await test.step('Verify each player has 2 cards', () => {
      expect(hands.P1.length).toBe(2);
      expect(hands.P2.length).toBe(2);
    });

    await test.step('Summarize and log round', () => {
      summary = roundEngine.summarizeAndLog();
    });

    await test.step('Verify round summary', () => {
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

  test('(e2e)_IfNoNaturalsBlackjack_PlayersHitOneMoreTime_CheckWhoWins', async ({roundEngine,}) => {
    let newDeck: Awaited<ReturnType<typeof roundEngine.startRound>>['newDeck'];
    let shuffle: Awaited<ReturnType<typeof roundEngine.startRound>>['shuffle'];
    let deal: Awaited<ReturnType<typeof roundEngine.dealInitial>>;
    let naturals: ReturnType<typeof roundEngine.hasNaturalBlackjack>;
    let hit1: Awaited<ReturnType<typeof roundEngine.hit>>;
    let hit2: Awaited<ReturnType<typeof roundEngine.hit>>;
    let hands: ReturnType<typeof roundEngine.getHands>;
    let expectedLen: number;
    let summary: ReturnType<typeof roundEngine.summarizeAndLog>;

    await test.step('Start round and shuffle deck', async () => {
      ({ newDeck, shuffle } = await roundEngine.startRound());
    });

    await test.step('Verify round started successfully', () => {
      expect(newDeck.response.ok()).toBeTruthy();
      expect(shuffle?.response.ok()).toBeTruthy();
    });

    await test.step('Deal initial cards', async () => {
      deal = await roundEngine.dealInitial();
    });

    await test.step('Verify cards were dealt', () => {
      expect(deal.response.ok()).toBeTruthy();
    });

    await test.step('Check for natural blackjack', () => {
      naturals = roundEngine.hasNaturalBlackjack();
    });

    await test.step('Players hit if no natural blackjack', async () => {
      //This if here to follow the natural blackjack logic
      if (!naturals.P1 && !naturals.P2) {
        hit1 = await roundEngine.hit('P1');
        hit2 = await roundEngine.hit('P2');
        expect(hit1.response.ok()).toBeTruthy();
        expect(hit2.response.ok()).toBeTruthy();
      }
    });

    await test.step('Get player hands', () => {
      hands = roundEngine.getHands();
      expectedLen = !naturals.P1 && !naturals.P2 ? 3 : 2;
    });

    await test.step('Verify hand sizes', () => {
      expect(hands.P1.length).toBe(expectedLen);
      expect(hands.P2.length).toBe(expectedLen);
    });

    await test.step('Summarize and verify final scores', () => {
      summary = roundEngine.summarizeAndLog();
      for (const p of summary.players) {
        expect(p.codes.length).toBe(expectedLen);
        expect(typeof p.score).toBe('number');
      }
    });
  });
});
