export const googleAppsScriptCode = `/**
 * Simple Billing Software - Google Sheets Sync script
 * 
 * Instructions:
 * 1. Open Google Sheets (sheets.google.com).
 * 2. Create a new Spreadsheet and name it "My Billing Database".
 * 3. Go to Extenions -> Apps Script.
 * 4. Delete any existing code and paste this script.
 * 5. Click the "Save" icon (Floppy disk).
 * 6. Click "Deploy" -> "New deployment".
 * 7. Click the Gear icon -> select "Web app".
 * 8. Set Description: "Billing Sync API".
 * 9. Set "Execute as": "Me (your email)".
 * 10. Set "Who has access": "Anyone".
 * 11. Click "Deploy", approve permissions, and COPY the Web App URL!
 * 12. Paste the Web App URL in the Settings/Sync tab of this App.
 */

// Handle GET request (used to test connection)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Connected to Google Sheets successfully via Google Apps Script!",
    spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
    spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Handle POST request (used to sync invoices)
function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Set up or get sheets
    var invoiceSheet = getOrCreateSheet(ss, "Invoices", [
      "Invoice Number", 
      "Date", 
      "Customer Name", 
      "Customer Phone", 
      "Customer Email", 
      "Customer Address", 
      "Subtotal (₹)", 
      "Discount (₹)", 
      "GST / Tax (₹)", 
      "Grand Total (₹)", 
      "Payment Method", 
      "Status",
      "Synced At"
    ]);
    
    var itemsSheet = getOrCreateSheet(ss, "Invoice_Items", [
      "Invoice Number",
      "Item Name",
      "Description",
      "Quantity",
      "Unit Price (₹)",
      "Tax Rate (%)",
      "Item Total (₹)"
    ]);
    
    if (payload.action === "sync_invoice") {
      var inv = payload.invoice;
      
      // Check if invoice already exists in the "Invoices" sheet to avoid duplicates
      var existingRowIndex = findRowByValue(invoiceSheet, 1, inv.id);
      
      var invoiceRowData = [
        inv.id,
        formatDate(inv.createdAt),
        inv.customerName,
        "'" + inv.customerPhone, // Prefix with apostrophe to keep leading zeros/string representation
        inv.customerEmail,
        inv.customerAddress,
        inv.subtotal,
        inv.discount,
        inv.taxTotal,
        inv.grandTotal,
        inv.paymentMethod,
        inv.status,
        new Date().toISOString()
      ];
      
      if (existingRowIndex > -1) {
        // Update existing invoice
        var range = invoiceSheet.getRange(existingRowIndex, 1, 1, invoiceRowData.length);
        range.setValues([invoiceRowData]);
        
        // Clear previous items of this invoice to prevent double item logging
        deleteRowsByValue(itemsSheet, 1, inv.id);
      } else {
        // Append new invoice
        invoiceSheet.appendRow(invoiceRowData);
      }
      
      // Append invoice items
      if (inv.items && inv.items.length > 0) {
        for (var i = 0; i < inv.items.length; i++) {
          var item = inv.items[i];
          var itemSubtotal = item.unit === 'g' ? (item.quantity * item.price) / 1000 : (item.quantity * item.price);
          var itemTotal = itemSubtotal * (1 + item.taxPercent / 100);
          itemsSheet.appendRow([
            inv.id,
            item.name,
            (item.description || "") + (item.unit ? " [" + item.unit + "]" : ""),
            item.quantity,
            item.price,
            item.taxPercent,
            Number(itemTotal.toFixed(2))
          ]);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Invoice " + inv.id + " synced successfully!",
        invoiceId: inv.id
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Invalid action or payload"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Utility to find row index by searching a column
function findRowByValue(sheet, columnNumber, valueToSearch) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  
  var values = sheet.getRange(2, columnNumber, lastRow - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === valueToSearch) {
      return i + 2; // Rows are 1-indexed, and we skipped header (1 row)
    }
  }
  return -1;
}

// Utility to delete rows referencing an invoice
function deleteRowsByValue(sheet, columnNumber, valueToMatch) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  // Go backwards so index deletion doesn't break loop calculations
  for (var i = lastRow; i >= 2; i--) {
    if (sheet.getRange(i, columnNumber).getValue() === valueToMatch) {
      sheet.deleteRow(i);
    }
  }
}

// Helper to get sheeet or create it with headers if missing
function getOrCreateSheet(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
    sheet.appendRow(headers);
    // Format header row beautifully
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#10b981") // Emerald 500
               .setFontColor("#ffffff")
               .setFontWeight("bold")
               .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }
  return sheet;
}

// Simple date formatter
function formatDate(isoString) {
  try {
    var d = new Date(isoString);
    return d.getFullYear() + "-" + 
           ("0" + (d.getMonth() + 1)).slice(-2) + "-" + 
           ("0" + d.getDate()).slice(-2) + " " + 
           ("0" + d.getHours()).slice(-2) + ":" + 
           ("0" + d.getMinutes()).slice(-2);
  } catch(e) {
    return isoString;
  }
}
`;
