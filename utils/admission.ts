
export const numberToWords = (num: number): string => {
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  
    if ((num = num.toString() as any).length > 9) return 'overflow';
    const n: any = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
  };
  
  export const dateToWords = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
  
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
  
    // Ordinal logic
    const j = day % 10, k = day % 100;
    let suffix = "th";
    if (j === 1 && k !== 11) suffix = "st";
    if (j === 2 && k !== 12) suffix = "nd";
    if (j === 3 && k !== 13) suffix = "rd";
  
    return `${day}${suffix} of ${month}, ${numberToWords(year)}`;
  };
  
  export const calculateNEPAge = (dobString: string, session: string, admissionClass: string) => {
    if (!dobString || !session || !admissionClass) return null;
  
    // 1. Extract Base Year from Session (e.g., "2025-26" -> 2025)
    const baseYearMatch = session.match(/^(\d{4})/);
    if (!baseYearMatch) return null;
    const baseYear = parseInt(baseYearMatch[1]);
  
    // 2. Convert Class to Number
    let classNum = 0;
    const cls = admissionClass.toLowerCase();
    if (cls.includes('nursery')) classNum = -2;
    else if (cls.includes('lkg')) classNum = -1;
    else if (cls.includes('ukg')) classNum = 0;
    else classNum = parseInt(cls.replace(/\D/g, '')) || 0;
  
    // 3. Calculate Target Year (Class 10)
    // If student is in class 1 now (baseYear), they reach class 10 in (10 - 1) = 9 years.
    // Year in Class 10 = baseYear + (10 - classNum)
    const yearsToReach10 = 10 - classNum;
    const targetYear = baseYear + yearsToReach10;
  
    // 4. Reference Date: 1st August of Target Year
    const targetDate = new Date(`${targetYear}-08-01`);
    const dob = new Date(dobString);
  
    // 5. Diff calculation
    let years = targetDate.getFullYear() - dob.getFullYear();
    let months = targetDate.getMonth() - dob.getMonth();
    let days = targetDate.getDate() - dob.getDate();
  
    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
  
    const isEligible = years >= 16; // NEP 2020: Should be 16+ when appearing for Class 10 Boards (approx) or 6+ for Class 1. 
    // Using the specific 16+ rule requested.
  
    return {
      ageYears: years,
      ageMonths: months,
      ageDays: days,
      targetYear,
      isEligible
    };
  };
