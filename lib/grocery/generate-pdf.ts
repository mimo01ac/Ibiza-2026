import { jsPDF } from "jspdf";
import type { GroceryItemWithVotes, GroceryCategory } from "@/lib/types/database";

const CATEGORY_LABELS: Record<GroceryCategory, string> = {
  food_snacks: "Food & Snacks",
  drinks: "Drinks",
  other: "Other",
};

const CATEGORY_ORDER: GroceryCategory[] = ["food_snacks", "drinks", "other"];

export function downloadGroceryPdf(items: GroceryItemWithVotes[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Ibiza 2026 - Shopping List", pageWidth / 2, y, {
    align: "center",
  });
  y += 12;

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, pageWidth / 2, y, {
    align: "center",
  });
  doc.setTextColor(0, 0, 0);
  y += 12;

  // Group by category
  const grouped: Record<GroceryCategory, GroceryItemWithVotes[]> = {
    food_snacks: [],
    drinks: [],
    other: [],
  };

  for (const item of items) {
    grouped[item.category].push(item);
  }

  for (const cat of CATEGORY_ORDER) {
    const catItems = grouped[cat];
    if (catItems.length === 0) continue;

    // Check page space
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    // Category header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(CATEGORY_LABELS[cat], 14, y);
    y += 2;

    // Underline
    doc.setDrawColor(180, 180, 180);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    doc.setFontSize(11);

    for (const item of catItems) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }

      // Checkbox
      doc.setDrawColor(100, 100, 100);
      doc.rect(14, y - 3.5, 4, 4);
      if (item.is_purchased) {
        doc.setFont("helvetica", "bold");
        doc.text("x", 15, y);
      }

      // Item name
      doc.setFont("helvetica", item.is_purchased ? "normal" : "bold");
      const nameText = item.is_purchased ? `${item.name} (purchased)` : item.name;
      doc.text(nameText, 22, y);

      // Quantity + votes on right
      const rightText = `qty: ${item.quantity}  |  ${item.vote_count} vote${item.vote_count !== 1 ? "s" : ""}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(rightText, pageWidth - 14, y, { align: "right" });
      doc.setFontSize(11);

      y += 7;
    }

    y += 6;
  }

  // Summary footer
  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  y += 4;
  doc.setDrawColor(100, 100, 100);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const totalItems = items.length;
  const purchased = items.filter((i) => i.is_purchased).length;
  const remaining = totalItems - purchased;

  doc.text(
    `Total: ${totalItems} items  |  Purchased: ${purchased}  |  Remaining: ${remaining}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );

  doc.save("ibiza-2026-shopping-list.pdf");
}
