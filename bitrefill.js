'use strict';
async function issueGiftCard({ valueCents, handle }) {
  const provider = (process.env.GIFT_CARD_PROVIDER || 'manual').toLowerCase();
  const amount = (valueCents / 100).toFixed(2);
  if (provider === 'manual') {
    return {
      manual: true,
      instructions: `Buy a $${amount} gift card on bitrefill.com for ${handle || 'this user'}, pay with Lightning, then paste the code here.`,
    };
  }
  throw new Error(`GIFT_CARD_PROVIDER="${provider}" is not implemented.`);
}
module.exports = { issueGiftCard };
