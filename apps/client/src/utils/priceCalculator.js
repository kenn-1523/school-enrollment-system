import { coursesData } from '@repo/business-logic';

export const calculateTuition = (selectedCodes) => {
    // 1. Safety Checks
    if (!selectedCodes || !Array.isArray(selectedCodes)) {
        return { paidCount: 0, subtotal: 0, finalTotal: 0, discountPercent: 0, discountAmount: 0, selectedObjects: [] };
    }
    const safeData = coursesData || [];
    
    // 2. Core Calculations
    const selectedObjects = safeData.filter(c => selectedCodes.includes(c.code));
    const paidCount = selectedObjects.filter(c => c.isPaid).length;
    const subtotal = selectedObjects.reduce((sum, c) => sum + c.price, 0);

    // 3. Discount Logic
    let discountPercent = 0;
    if (paidCount === 2) discountPercent = 0.10;
    else if (paidCount === 3) discountPercent = 0.15;
    else if (paidCount === 4) discountPercent = 0.20;
    else if (paidCount >= 5) discountPercent = 0.25;

    const discountAmount = subtotal * discountPercent;
    const finalTotal = subtotal - discountAmount;

    // 4. NEW: Gamification Logic (Moved from Page)
    let nextTarget = null;
    let progressFill = 0;
    
    if (paidCount < 2) nextTarget = { next: 2, percent: "10%" };
    else if (paidCount < 3) nextTarget = { next: 3, percent: "15%" };
    else if (paidCount < 4) nextTarget = { next: 4, percent: "20%" };
    else if (paidCount < 5) nextTarget = { next: 5, percent: "25%" };

    // Calculate progress bar (0 to 100)
    progressFill = Math.min((paidCount / 5) * 100, 100);

    // 5. NEW: Free Course Logic
    // If ANY paid course is selected, the free course is included
    const isFreeIncluded = paidCount > 0;

    return {
        selectedObjects,
        paidCount,
        subtotal,
        discountPercent,
        discountAmount,
        finalTotal,
        nextTarget,    // New
        progressFill,  // New
        isFreeIncluded // New
    };
};