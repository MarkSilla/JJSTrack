/** Sum all line items for a single order */
export const calcOrderTotal = (order) =>
    order.invoice.items.reduce(
        (sum, item) => sum + item.unitPrice * item.qty + (item.addOnPrice || 0),
        0
    );

/** Format a number as Philippine Peso */
export const fmt = (n) => "₱" + n.toLocaleString("en-PH");

/** Today's date as a long locale string */
export const todayLabel = () =>
    new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
