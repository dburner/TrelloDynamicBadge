/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;

var BLACK_ROCKET_ICON = "https://cdn.glitch.com/1b42d7fe-bda8-4af8-a6c8-eff0cea9e08a%2Frocket-ship.png?1494946700421";
var PRICE_TAG_ICON = "https://cdn.glitch.global/6c3fd098-187e-4506-a7cc-c21dbb301f70/price-tag-icon.png?v=1680461173244"

window.TrelloPowerUp.initialize({
  "card-badges": function (t, opts) {
    let cardAttachments = opts.attachments; // Trello passes you the attachments on the card
    return t
      .card("name", "desc")
      .get("desc", "desc")
      .then(function (cardDesc, cardName) {
        console.log("We just loaded the card name for fun: " + cardName + cardDesc);
        return [
          {
            // Dynamic badges can have their function rerun
            // after a set number of seconds defined by refresh.
            // Minimum of 10 seconds.
            dynamic: function () {
              // we could also return a Promise that resolves to
              // this as well if we needed to do something async first
              const regex = /- \*\*Price\*\*: (.{1,50})\n/;
              const match = cardDesc.match(regex);
              
              const ids = match.length == 2 ? match[1] : ' no match';

              
              return {
                text: "Price " + ids.toString(),
                icon: PRICE_TAG_ICON, //"./images/icon.svg",
                color: "light-gray",
                refresh: 10, // in seconds
              };
            },
          }
        ];
      });
  },
});
