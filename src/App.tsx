import { useState, useEffect } from 'react';
import './App.css'; // Make sure to create this CSS file

export default function Calculator() {
  const [values, setValues] = useState({
    rate: 650,
    days: 252,
    expense: 4012,
    employerNI: 479,
    pension: 60000,
    salary: 12570,
    dividend: 37700,
    dividendAllowance: 500
  });

  // Handle input changes
  const handleInputChange = (e:any) => {
    const { id, value } = e.target;
    setValues({
      ...values,
      [id]: parseFloat(value) || 0
    });
  };

  // Calculate all values based on inputs
  const calculateResults = () => {
    const { rate, days, expense, employerNI, pension, salary, dividend, dividendAllowance } = values;

    const grossProfit = rate * days; // Calculate gross profit

    // Constants for calculations (2024/2025 tax year)
    const corporateTaxLowerLimit = 50000; // Small profits rate limit
    const corporateTaxUpperLimit = 250000; // Main rate limit for marginal relief
    const corporateTaxSmallRate = 0.19; // 19%
    const corporateTaxMainRate = 0.25; // 25%
    const corporateTaxMarginalReliefFraction = 3 / 200; // 0.015

    const personalAllowance = 12570; // Standard Personal Allowance
    // Note: basicRateLimit is the size of the band, not the upper threshold
    const basicRateLimit = 37700; // Basic rate income tax band limit (50270 total income - 12570 PA)
    const higherRateLimit = 125140; // Higher rate income tax threshold

    const dividendBasicRate = 0.0875; // 8.75%
    const dividendHigherRate = 0.3375; // 33.75%
    const dividendAdditionalRate = 0.3935; // 39.35%

    // Employee National Insurance Constants (2024/2025 Annual Figures)
    const employeeNI_PT = 12570; // Primary Threshold
    const employeeNI_UEL = 50270; // Upper Earnings Limit
    const employeeNI_Rate_BelowUEL = 0.08; // 8% between PT and UEL
    const employeeNI_Rate_AboveUEL = 0.02; // 2% above UEL

    const profit = grossProfit - expense - salary - employerNI - pension;

    // Calculate corporation tax
    let corporationTax = 0;
    if (profit <= corporateTaxLowerLimit) {
        corporationTax = profit * corporateTaxSmallRate;
    } else if (profit <= corporateTaxUpperLimit) {
        // Marginal Relief Calculation
        const marginalRelief = (corporateTaxUpperLimit - profit) * corporateTaxMarginalReliefFraction;
        corporationTax = (profit * corporateTaxMainRate) - marginalRelief;
    } else {
        corporationTax = profit * corporateTaxMainRate;
    }
    corporationTax = Math.max(0, corporationTax); // Ensure tax is not negative

    // Calculate net profit
    const netProfit = profit - corporationTax;

    // Calculate amount left in business
    const leftInBusiness = netProfit - dividend;

    // Calculate personal income tax on salary
    let personalSalaryTax = 0;
    const taxableSalary = Math.max(0, salary - personalAllowance); // Salary amount subject to income tax after PA

    if (taxableSalary > 0) {
        // Basic rate tax on salary
        const basicRateSalaryTaxable = Math.min(taxableSalary, basicRateLimit);
        personalSalaryTax += basicRateSalaryTaxable * 0.20; // 20% basic rate

        // Higher rate tax on salary
        const higherRateSalaryTaxable = Math.max(0, taxableSalary - basicRateLimit);
        if (higherRateSalaryTaxable > 0) {
            // Income above basic rate band is taxed at higher/additional rates
            const taxableAtHigherOrAdditionalRate = higherRateSalaryTaxable;
            const higherRateBandSize = (higherRateLimit - personalAllowance) - basicRateLimit; // The size of the higher rate band after PA and basic rate band

            const taxableAtHigherRate = Math.min(taxableAtHigherOrAdditionalRate, higherRateBandSize);
            personalSalaryTax += taxableAtHigherRate * 0.40; // 40% higher rate

            // Additional rate tax on salary
            const additionalRateSalaryTaxable = Math.max(0, taxableAtHigherOrAdditionalRate - higherRateBandSize);
            personalSalaryTax += additionalRateSalaryTaxable * 0.45; // 45% additional rate
        }
    }
    personalSalaryTax = Math.max(0, personalSalaryTax); // Ensure tax is not negative

    // Calculate Employee National Insurance Contributions
    let employeeNI = 0;
    const salaryAbovePT = Math.max(0, salary - employeeNI_PT); // Salary amount subject to NI above Primary Threshold

    if (salaryAbovePT > 0) {
        // NI at basic rate (8%) up to UEL
        const taxableBelowUEL = Math.min(salaryAbovePT, employeeNI_UEL - employeeNI_PT);
        employeeNI += taxableBelowUEL * employeeNI_Rate_BelowUEL;

        // NI at higher rate (2%) above UEL
        const taxableAboveUEL = Math.max(0, salaryAbovePT - (employeeNI_UEL - employeeNI_PT));
        employeeNI += taxableAboveUEL * employeeNI_Rate_AboveUEL;
    }
    employeeNI = Math.max(0, employeeNI); // Ensure NI is not negative

    // Calculate personal dividend tax
    let personalDividendTax = 0;
    let remainingDividend = Math.max(0, dividend - dividendAllowance); // Apply dividend allowance first

    if (remainingDividend > 0) {
        // Determine remaining tax bands after salary income tax *and* PA
        // Dividend tax is applied on top of other income (salary).
        const totalIncomeTaxed = taxableSalary; // Amount of salary that used up tax bands (salary - PA)

        // First, check how much of the basic rate band is left.
        const basicRateBandRemaining = Math.max(0, basicRateLimit - totalIncomeTaxed);

        // Tax dividends at basic rate (8.75%) up to the remaining basic rate band
        const dividendTaxableAtBasicRate = Math.min(remainingDividend, basicRateBandRemaining);
        personalDividendTax += dividendTaxableAtBasicRate * dividendBasicRate;
        remainingDividend -= dividendTaxableAtBasicRate;

        if (remainingDividend > 0) {
            // Then, check how much of the higher rate band is left.
            // The higher rate band starts after the basic rate limit (basicRateLimit + PA)
            const higherRateBandStart = basicRateLimit + personalAllowance; // The point where higher rate tax *would* start if no PA
            const actualHigherRateThreshold = higherRateLimit; // The point where higher rate tax *actually* starts with PA considered against total income

            // Amount of the higher rate band used by salary
            const higherRateBandUsedBySalary = Math.max(0, totalIncomeTaxed - basicRateLimit);
            // Remaining higher rate band available for dividends
            const higherRateBandRemaining = Math.max(0, (higherRateLimit - personalAllowance - basicRateLimit) - higherRateBandUsedBySalary);

            // Tax dividends at higher rate (33.75%) up to the remaining higher rate band
            const dividendTaxableAtHigherRate = Math.min(remainingDividend, higherRateBandRemaining);
            personalDividendTax += dividendTaxableAtHigherRate * dividendHigherRate;
            remainingDividend -= dividendTaxableAtHigherRate;

            if (remainingDividend > 0) {
                // Any remaining dividends are taxed at the additional rate (39.35%)
                personalDividendTax += remainingDividend * dividendAdditionalRate;
            }
        }
    }
    personalDividendTax = Math.max(0, personalDividendTax); // Ensure tax is not negative

    // Calculate pocket money (Net Pay)
    // Net salary is Gross Salary - Income Tax - Employee NI
    const salaryAfterTax = salary - personalSalaryTax - employeeNI;
    const dividendsAfterTax = dividend - personalDividendTax;
    const pocketMoney = salaryAfterTax + dividendsAfterTax;

    // Calculate total money kept (in some way) - Still conceptually questionable.
    // This sum includes money paid out (pocket money, pension) and money retained by the company (leftInBusiness).
    // Expense is money spent by the company, not kept by the individual.
    const totalMoneyKept = pocketMoney + expense + leftInBusiness + pension;

    // Calculate money lost to taxes and NI
    // Includes Corporation Tax, Personal Income Tax (on salary), Personal Dividend Tax, Employer NI, AND Employee NI.
    const moneyLostToTaxes = corporationTax + personalDividendTax + personalSalaryTax + employerNI + employeeNI;

    return {
      grossProfit,
      expense,
      salary,
      employerNI,
      pension,
      profit,
      corporationTax,
      netProfit,
      dividend,
      leftInBusiness,
      dividendAllowance,
      salaryAfterTax,
      dividendsAfterTax,
      personalDividendTax,
      personalSalaryTax,
      employeeNI,
      pocketMoney,
      totalMoneyKept,
      moneyLostToTaxes
    };
  };

  // Get calculated results
  const results = calculateResults();

  useEffect(() => {
    const grossProfit = results.grossProfit;
    const { expense, employerNI, salary, pension } = values;
    
    // Check if the total exceeds gross profit
    if ((expense + employerNI + salary + pension) > grossProfit) {
      // Create a copy of current values
      let updatedValues = { ...values };
      let remaining = grossProfit;
      
      // Deduct expenses first (expense has lowest priority)
      updatedValues.expense = Math.min(remaining, expense);
      remaining = Math.max(0, remaining - updatedValues.expense);
      
      // Next deduct NI
      updatedValues.employerNI = Math.min(remaining, employerNI);
      remaining = Math.max(0, remaining - updatedValues.employerNI);
      
      // Then deduct salary
      updatedValues.salary = Math.min(remaining, salary);
      remaining = Math.max(0, remaining - updatedValues.salary);
      
      // Finally deduct pension (highest priority)
      updatedValues.pension = Math.min(remaining, pension);
      
      // Update the values
      setValues(updatedValues);
    }

    
  }, [results.grossProfit]);

  useEffect(() => {
    if(values.dividend > results.netProfit) {
      setValues(prev => ({
        ...prev,
        dividend: results.netProfit > 0 ? results.netProfit : 0
      }));
    }
  }, [results.netProfit]);

  return (
    <div className="calculator-container">
      <h1 className="calculator-title">Business Owner Tax Calculator</h1>
      
      <div className="calculator-grid">
        <div className="input-section">
          <h2 className="section-title">Calculator Inputs</h2>
          <div className="input-fields">
            <div className='flex'>
              <div className="input-group">
                <label htmlFor="rate">Daily Rate (£)</label>
                <input
                  id="rate"
                  type="number"
                  value={values.rate}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="days">Working Days in a Year</label>
                <input
                  id="days"
                  type="number"
                  value={values.days}
                  onChange={handleInputChange}
                />
              </div>
              <div className="input-group">
                <label htmlFor="grossProfit"> = Gross Profit (£)</label>
                <input
                  id="grossProfit"
                  type="number"
                  value={values.rate * values.days}
                  readOnly
                />
                </div>
            </div>
            
            <h2 className="section-title">Expenses</h2>
            <div className="input-group">
              <label htmlFor="expense">Expenses £{values.expense}</label>
              <input
                id="expense"
                type="range"
                max={results.grossProfit - values.employerNI - values.pension - values.salary}
                value={values.expense}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="employerNI">Employer NIC £{values.employerNI}</label>
              <input
                id="employerNI"
                type="range"
                max={results.grossProfit - values.expense - values.pension - values.salary}
                value={values.employerNI}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="input-group">
              <label htmlFor="salary">Payout Salary £{values.salary}</label>
              <input
                id="salary"
                type="range"
                max={results.grossProfit - values.expense - values.employerNI - values.pension}
                value={values.salary}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="pension">Employer Pension £{values.pension} </label>
              <input
                id="pension"
                type="range"
                max={results.grossProfit - values.expense - values.employerNI - values.salary}
                value={values.pension}
                onChange={handleInputChange}
              />
            </div>

            <div className="input-group">
              Profits after expenses
              <p>= £{results.profit}</p>
            </div>
            
            <h2 className="section-title">Payout (After Corporation Tax)</h2>
            <div className="input-group">
              <label htmlFor="dividend">Dividend Payout £{values.dividend}</label>
              <input
                id="dividend"
                type="range"
                max={results.netProfit}
                value={values.dividend}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
        
        <div className="results-sections">
          <div className="results-grid">
            <div className="result-section green">
              <h2 className="section-title">Calculated Values</h2>
              <div className="result-items">
                <p><span className="label">Profit:</span> £{results.profit.toFixed(2)}</p>
                <p><span className="label">Final Corporation Tax:</span> £{results.corporationTax.toFixed(2)}</p>
                <p><span className="label">Net Profit:</span> £{results.netProfit.toFixed(2)}</p>
                <p><span className="label">Dividends:</span> £{results.dividend.toFixed(2)}</p>
                <p><span className="label">Left in Business:</span> £{results.leftInBusiness.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="result-section yellow">
              <h2 className="section-title">Pocket Money</h2>
              <div className="result-items">
                <p><span className="label">Salary (after tax):</span> £{results.salaryAfterTax.toFixed(2)}</p>
                <p><span className="label">Dividends (after tax):</span> £{results.dividendsAfterTax.toFixed(2)}</p>
                <p><span className="label">Total Pocket Money:</span> £{results.pocketMoney.toFixed(2)}</p>
              </div>
            </div>

            <div className="result-section purple">
              <h2 className="section-title">Taxes</h2>
              <div className="result-items">
                <p><span className="label">Total Money Kept:</span> £{results.totalMoneyKept.toFixed(2)}</p>
                <p><span className="label">Corporate Tax:</span> £{results.corporationTax.toFixed(2)}</p>
                <p><span className="label">Personal Dividend Tax:</span> £{results.personalDividendTax.toFixed(2)}</p>
                <p><span className="label">Personal Salary Tax:</span> £{results.personalSalaryTax.toFixed(2)}</p>
                <p><span className="label">Employee NI:</span> £{results.employeeNI.toFixed(2)}</p>
                <p><span className="label">Employer NI:</span> £{results.employerNI.toFixed(2)}</p>
                <p><span className="label">Taxes Paid:</span> £{results.moneyLostToTaxes.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}