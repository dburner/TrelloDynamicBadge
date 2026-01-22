/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;

var BLACK_ROCKET_ICON = "https://cdn.glitch.com/1b42d7fe-bda8-4af8-a6c8-eff0cea9e08a%2Frocket-ship.png?1494946700421";
var PRICE_TAG_ICON    = "https://cdn.glitch.global/6c3fd098-187e-4506-a7cc-c21dbb301f70/price-tag-icon.png?v=1680461173244";

// --- HELPER FUNCTION ---
// Extracts price from description. Handles newlines and different formats robustly.
function getPrice(desc) {
  if (!desc) return null;
  // Regex looks for "- **Price**: " followed by text, ending at a newline or end of string
  const regex = /- \*\*Price\*\*: (.*?)(?:\n|$)/;
  const match = desc.match(regex);
  
  if (match && match[1]) {
    // Remove non-numeric characters (like currency symbols) to get the raw number
    const cleanValue = match[1].replace(/[^\d.-]/g, ''); 
    const number = parseFloat(cleanValue);
    
    return {
      text: match[1],                 // The display text (e.g. "$500")
      value: isNaN(number) ? 0 : number // The numeric value for sorting/math (e.g. 500)
    };
  }
  return null;
}

var badgeFunction = function (t, opts) {
    return t
      .card("name", "desc")
      .get("desc")
      .then(function (cardDesc) {
        const priceData = getPrice(cardDesc);
        
        if (!priceData) return [];

        return [{
          dynamic: function () {
            return {
              text: "Price " + priceData.text,
              icon: PRICE_TAG_ICON,
              color: "light-gray",
              refresh: 10, 
            };
          },
        }];
      });
}

window.TrelloPowerUp.initialize({
  // 1. ORIGINAL: Card Badges
  "card-detail-badges": badgeFunction,
  "card-badges": badgeFunction,

  // 2. ORIGINAL: List Sorters
  "list-sorters": function (t) {
    return t.list("name", "id").then(function (list) {
      return [{
        text: "Price (High to Low)",
        callback: function (t, opts) {
          const sortedCards = opts.cards.sort((a, b) => {
            const valA = getPrice(a.desc)?.value || 0;
            const valB = getPrice(b.desc)?.value || 0;
            
            // Sort Descending (High to Low)
            return valB - valA; 
          });

          return {
            sortedIds: sortedCards.map(c => c.id),
          };
        },
      }];
    });
  },

  // 3. NEW: Board Button (Global Search)
  "board-buttons": function (t, opts) {
    return [{
      icon: BLACK_ROCKET_ICON,
      text: "Search Prices",
      callback: function (t) {
        return t.popup({
          title: 'Find Items by Price',
          items: function (t, options) {
            const query = parseFloat(options.search);
            const threshold = isNaN(query) ? 0 : query;

            // Search ALL cards on the board
            return t.cards('all').then(function (cards) {
              const matches = cards
                .map(card => ({ card: card, price: getPrice(card.desc) }))
                // Filter: Price exists AND is greater than searched value
                .filter(item => item.price && item.price.value >= threshold)
                .sort((a, b) => b.price.value - a.price.value);

              // Map to Trello Popup Items
              return matches.map(item => ({
                text: `${item.card.name} (${item.price.text})`,
                callback: function (t) {
                  return t.showCard(item.card.id);
                }
              }));
            });
          },
          search: {
            count: 10,
            placeholder: 'Type min price (e.g. 50)',
            debounce: 300, // Wait 300ms after typing stops to search
          }
        });
      }
    }];
  },

  // 4. NEW: List Actions (Column Stats)
  "list-actions": function (t) {
    return t.list("name", "id").then(function (list) {
      return [{
        text: "Calculate List Total",
        callback: function (t) {
          // Get only the cards in the current list
          return t.list('cards', 'name').then(function (listData) {
            let total = 0;
            let count = 0;

            listData.cards.forEach(card => {
              const p = getPrice(card.desc);
              if (p) {
                total += p.value;
                count++;
              }
            });

            return t.popup({
              title: 'Column Stats',
              items: [
                { text: `Total Value: ${total}`, alwaysVisible: true },
                { text: `Item Count: ${count}`, alwaysVisible: true },
                { text: `Average Price: ${count ? (total/count).toFixed(2) : 0}`, alwaysVisible: true }
              ]
            });
          });
        }
      }];
    });
  }
});
