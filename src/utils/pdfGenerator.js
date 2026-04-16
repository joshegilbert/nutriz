import { jsPDF } from 'jspdf';
import { format, parseISO } from 'date-fns';

/**
 * Professional PDF generator for meal plans
 * Creates styled PDFs similar to EvolutionNutrition format
 */
export function generateMealPlanPDF({ client, program, planSummary, shoppingListItems, lookupName }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Colors
  const primaryColor = [25, 118, 210]; // Blue
  const darkGray = [33, 33, 33];
  const lightGray = [158, 158, 158];
  const borderGray = [224, 224, 224];

  // Helper: Check if we need a new page
  const checkPageBreak = (requiredHeight = 10) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper: Draw horizontal line
  const drawLine = (y, color = borderGray, width = contentWidth) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + width, y);
  };

  // Helper: Add text with styling
  const addText = (text, x, y, options = {}) => {
    const {
      fontSize = 10,
      fontStyle = 'normal',
      color = darkGray,
      align = 'left',
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);
    doc.text(text, x, y, { align });
  };

  // Header Section
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  addText('MEAL PLAN SUMMARY', margin, 20, {
    fontSize: 18,
    fontStyle: 'bold',
    color: [255, 255, 255],
  });

  addText(client?.name || 'Client', margin, 28, {
    fontSize: 12,
    color: [255, 255, 255],
  });

  const generatedDate = format(new Date(), 'MMMM d, yyyy');
  addText(`Generated: ${generatedDate}`, pageWidth - margin, 28, {
    fontSize: 10,
    color: [255, 255, 255],
    align: 'right',
  });

  yPos = 45;

  // Plan Overview Section
  addText('PLAN OVERVIEW', margin, yPos, {
    fontSize: 14,
    fontStyle: 'bold',
  });
  yPos += 8;

  drawLine(yPos);
  yPos += 5;

  if (planSummary) {
    const overviewData = [
      ['Start Date', planSummary.startLabel],
      ['End Date', planSummary.endLabel],
      ['Program Length', planSummary.lengthLabel],
      ['Total Meals', `${planSummary.totalMeals} meal${planSummary.totalMeals !== 1 ? 's' : ''}`],
      ['Total Items', `${planSummary.totalItems} item${planSummary.totalItems !== 1 ? 's' : ''}`],
      ['Shopping Items', `${shoppingListItems.length} item${shoppingListItems.length !== 1 ? 's' : ''}`],
    ];

    overviewData.forEach(([label, value]) => {
      checkPageBreak(7);
      addText(label + ':', margin, yPos, { fontSize: 10, color: lightGray });
      addText(value, margin + 50, yPos, { fontSize: 10, fontStyle: 'bold' });
      yPos += 6;
    });
  }

  yPos += 5;

  // Daily Meal Plan Section
  checkPageBreak(20);
  addText('DAILY MEAL PLAN', margin, yPos, {
    fontSize: 14,
    fontStyle: 'bold',
  });
  yPos += 8;

  const days = program?.days || [];
  if (days.length === 0) {
    addText('No days found in this plan.', margin, yPos, {
      fontSize: 10,
      color: lightGray,
    });
    yPos += 10;
  } else {
    days.forEach((day, dayIndex) => {
      checkPageBreak(30);
      
      // Day header
      const dayDate = day.date ? parseISO(day.date) : null;
      const dayLabel = dayDate
        ? format(dayDate, 'EEEE, MMMM d, yyyy')
        : `Day ${dayIndex + 1}`;
      
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
      
      addText(dayLabel.toUpperCase(), margin + 2, yPos, {
        fontSize: 11,
        fontStyle: 'bold',
      });

      const dayDetails = [];
      if (day?.meals?.length) {
        dayDetails.push(`${day.meals.length} meal${day.meals.length !== 1 ? 's' : ''}`);
      }
      if (day?.macros?.calories) {
        dayDetails.push(`${Math.round(day.macros.calories)} kcal`);
      }
      if (day?.macros?.protein) {
        dayDetails.push(`P: ${Math.round(day.macros.protein)}g`);
      }
      if (day?.macros?.carbs) {
        dayDetails.push(`C: ${Math.round(day.macros.carbs)}g`);
      }
      if (day?.macros?.fat) {
        dayDetails.push(`F: ${Math.round(day.macros.fat)}g`);
      }

      if (dayDetails.length) {
        addText(dayDetails.join(' • '), pageWidth - margin, yPos, {
          fontSize: 9,
          color: lightGray,
          align: 'right',
        });
      }

      yPos += 10;

      // Meals for this day
      if (!day?.meals?.length) {
        addText('No meals planned for this day.', margin + 5, yPos, {
          fontSize: 9,
          color: lightGray,
        });
        yPos += 8;
      } else {
        day.meals.forEach((meal, mealIndex) => {
          checkPageBreak(15);
          
          const mealName = meal.mealTime || meal.name || 'Meal';
          addText(`${mealIndex + 1}. ${mealName}`, margin + 5, yPos, {
            fontSize: 10,
            fontStyle: 'bold',
          });

          if (meal?.macros?.calories) {
            const mealMacros = [];
            if (meal.macros.calories) mealMacros.push(`${Math.round(meal.macros.calories)} kcal`);
            if (meal.macros.protein) mealMacros.push(`P: ${Math.round(meal.macros.protein)}g`);
            if (meal.macros.carbs) mealMacros.push(`C: ${Math.round(meal.macros.carbs)}g`);
            if (meal.macros.fat) mealMacros.push(`F: ${Math.round(meal.macros.fat)}g`);
            
            if (mealMacros.length) {
              addText(mealMacros.join(' • '), pageWidth - margin, yPos, {
                fontSize: 8,
                color: lightGray,
                align: 'right',
              });
            }
          }

          yPos += 6;

          // Meal items
          if (!meal?.items?.length) {
            addText('  No items listed for this meal.', margin + 5, yPos, {
              fontSize: 8,
              color: lightGray,
            });
            yPos += 5;
          } else {
            meal.items.forEach((item) => {
              checkPageBreak(6);
              
              const itemName = item?.name || (lookupName ? lookupName(item) : 'Item') || 'Item';
              const amountLabel = formatItemAmount(item);
              const notes = item?.notes?.trim();
              
              let itemText = `  • ${itemName}`;
              if (amountLabel) {
                itemText += ` (${amountLabel})`;
              }
              if (notes) {
                itemText += ` - ${notes}`;
              }

              addText(itemText, margin + 5, yPos, {
                fontSize: 9,
              });
              yPos += 5;
            });
          }

          yPos += 3;
        });
      }

      // Add spacing between days
      if (dayIndex < days.length - 1) {
        yPos += 5;
        drawLine(yPos, borderGray, contentWidth * 0.8);
        yPos += 8;
      }
    });
  }

  // Shopping List Section
  checkPageBreak(25);
  yPos += 5;
  addText('SHOPPING LIST', margin, yPos, {
    fontSize: 14,
    fontStyle: 'bold',
  });
  yPos += 8;

  drawLine(yPos);
  yPos += 5;

  if (!shoppingListItems.length) {
    addText('No ingredients listed for this plan.', margin, yPos, {
      fontSize: 10,
      color: lightGray,
    });
    yPos += 10;
  } else {
    // Table header
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos - 5, contentWidth, 6, 'F');
    
    addText('Item', margin + 2, yPos, { fontSize: 9, fontStyle: 'bold' });
    addText('Amount', margin + 100, yPos, { fontSize: 9, fontStyle: 'bold' });
    addText('Notes', margin + 140, yPos, { fontSize: 9, fontStyle: 'bold' });
    
    yPos += 8;
    drawLine(yPos);
    yPos += 3;

    shoppingListItems.forEach((item, index) => {
      checkPageBreak(8);
      
      addText(item.name, margin + 2, yPos, { fontSize: 9 });
      
      const amount = formatShoppingAmount(item);
      addText(amount !== '—' ? amount : '', margin + 100, yPos, { fontSize: 9 });
      
      const notes = item.notes.length
        ? item.notes.join('; ')
        : item.textual.length
        ? item.textual.join(', ')
        : '';
      if (notes) {
        const notesLines = doc.splitTextToSize(notes, 50);
        addText(notesLines[0] || '', margin + 140, yPos, { fontSize: 8, color: lightGray });
      }
      
      yPos += 6;
      
      if (index < shoppingListItems.length - 1) {
        drawLine(yPos, [240, 240, 240], contentWidth * 0.9);
        yPos += 2;
      }
    });
  }

  // Notes Section
  checkPageBreak(20);
  yPos += 10;
  addText('NOTES FOR THE CLIENT', margin, yPos, {
    fontSize: 14,
    fontStyle: 'bold',
  });
  yPos += 8;

  drawLine(yPos);
  yPos += 5;

  const notesText = String(client?.notes || '').trim();
  if (!notesText) {
    addText('No notes provided.', margin, yPos, {
      fontSize: 10,
      color: lightGray,
    });
  } else {
    const notesLines = doc.splitTextToSize(notesText, contentWidth - 10);
    notesLines.forEach((line) => {
      checkPageBreak(6);
      addText(line, margin, yPos, { fontSize: 10 });
      yPos += 5;
    });
  }

  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addText(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
      fontSize: 8,
      color: lightGray,
      align: 'center',
    });
  }

  return doc;
}

function formatItemAmount(item) {
  const amount = Number(item?.amount);
  const hasNumeric = Number.isFinite(amount);
  const cleanedAmount = hasNumeric ? formatNumber(amount) : String(item?.amount || '').trim();
  const unit = String(item?.unit || '').trim();
  const pieces = [];
  if (cleanedAmount) pieces.push(cleanedAmount);
  if (unit) pieces.push(unit);
  return pieces.join(' ');
}

function formatShoppingAmount(item) {
  const parts = [];
  if (item.total !== null) {
    parts.push(
      item.unit
        ? `${formatNumber(item.total)} ${item.unit}`
        : formatNumber(item.total)
    );
  }
  if (item.textual.length) {
    parts.push(item.textual.join(', '));
  }
  return parts.length ? parts.join(' · ') : '—';
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, '');
}

