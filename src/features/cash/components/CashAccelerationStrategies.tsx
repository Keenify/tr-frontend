import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import CashConversionCycleImage from '../../../assets/home/cash_conversion_cycle.png'; // Adjust path if needed

interface Strategy {
  id: number;
  description: string; // In a real app, users would input this.
  shortenCycle: boolean;
  eliminateMistakes: boolean;
  improveModel: boolean;
}

interface SectionData {
  title: string;
  strategies: Strategy[];
}

// Initialize data structure based on the image
const initialData: SectionData[] = [
  {
    title: 'Ways to improve your Sales Cycle',
    strategies: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      description: '',
      shortenCycle: false,
      eliminateMistakes: false,
      improveModel: false,
    })),
  },
  {
    title: 'Ways to improve your Make/Production & Inventory Cycle',
    strategies: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      description: '',
      shortenCycle: false,
      eliminateMistakes: false,
      improveModel: false,
    })),
  },
  {
    title: 'Ways to improve your Delivery Cycle',
    strategies: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      description: '',
      shortenCycle: false,
      eliminateMistakes: false,
      improveModel: false,
    })),
  },
  {
    title: 'Ways to improve your Billing & Payment Cycle',
    strategies: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      description: '',
      shortenCycle: false,
      eliminateMistakes: false,
      improveModel: false,
    })),
  },
];

const CashAccelerationStrategies: React.FC = () => {
  const [sections, setSections] = useState<SectionData[]>(initialData);

  // Handles description changes
  const handleDescriptionChange = (
    sectionIndex: number,
    strategyIndex: number,
    value: string
  ) => {
    setSections((prevSections) => {
      const newSections = JSON.parse(JSON.stringify(prevSections));
      newSections[sectionIndex].strategies[strategyIndex].description = value;
      return newSections;
    });
  };

  // Handles checkbox state changes
  const handleCheckboxChange = (
    sectionIndex: number,
    strategyIndex: number,
    field: keyof Pick<Strategy, 'shortenCycle' | 'eliminateMistakes' | 'improveModel'>
  ) => {
    setSections((prevSections) => {
      // Create a deep copy to avoid direct state mutation
      const newSections = JSON.parse(JSON.stringify(prevSections));
      const strategy = newSections[sectionIndex].strategies[strategyIndex];
      strategy[field] = !strategy[field];
      return newSections;
    });
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5" component="h1" sx={{ marginBottom: 0.5 }}>
        Cash: Cash Acceleration Strategies (CASh)
      </Typography>
      <Typography variant="subtitle1" component="h2" sx={{ marginBottom: 1.5 }}>
        Cash Conversion Cycle (CCC)
      </Typography>
      <Box
        component="img"
        src={CashConversionCycleImage}
        alt="Cash Conversion Cycle Diagram"
        sx={{
          maxWidth: '100%', // Ensure it fits the width
          height: 'auto', // Maintain aspect ratio
          display: 'block', // Remove extra space below image
          marginBottom: 2, // Add space below image
        }}
      />
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="cash acceleration strategies table" size="small">
          <TableHead>
            <TableRow>
              {/* Empty cell for section letter column */}
              <TableCell sx={{ width: '5%', borderRight: 1, borderColor: 'divider', backgroundColor: 'grey.200', "&:hover": { backgroundColor: 'grey.200' }, paddingY: 0.1, verticalAlign: 'middle', textAlign: 'center' }} />
              {/* Description column header */}
              <TableCell sx={{ width: '71%', borderRight: 1, borderColor: 'divider', backgroundColor: 'grey.200', "&:hover": { backgroundColor: 'grey.200' }, paddingY: 0.1, fontSize: '0.9rem', verticalAlign: 'middle', textAlign: 'center' }}>Strategy Description</TableCell>
              {/* Headers for the checkbox columns - Reduced width */}
              <TableCell align="center" sx={{ width: '8%', fontWeight: 'bold', fontSize: '0.85rem', borderLeft: 1, borderColor: 'divider', verticalAlign: 'middle', textAlign: 'center', paddingX: 0.25, paddingY: 0.1, backgroundColor: 'grey.200', "&:hover": { backgroundColor: 'grey.200' } }}>Shorten Cycle Times</TableCell>
              <TableCell align="center" sx={{ width: '8%', fontWeight: 'bold', fontSize: '0.85rem', borderLeft: 1, borderColor: 'divider', verticalAlign: 'middle', textAlign: 'center', paddingX: 0.25, paddingY: 0.1, backgroundColor: 'grey.200', "&:hover": { backgroundColor: 'grey.200' } }}>Eliminate Mistakes</TableCell>
              <TableCell align="center" sx={{ width: '8%', fontWeight: 'bold', fontSize: '0.85rem', borderLeft: 1, borderColor: 'divider', verticalAlign: 'middle', textAlign: 'center', paddingX: 0.25, paddingY: 0.1, backgroundColor: 'grey.200', "&:hover": { backgroundColor: 'grey.200' } }}>Improve Business Model & P/L</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sections.map((section, sectionIndex) => (
              // Use React.Fragment to group section header and strategy rows
              <React.Fragment key={sectionIndex}>
                {/* Section Header Row */}
                <TableRow sx={{ backgroundColor: '#606060', '& > *': { color: 'white !important', fontWeight: 'bold', borderBottom: 'none', paddingY: 0.5 }, "&:hover": { backgroundColor: '#606060' } }}>
                  <TableCell align="center" sx={{ borderRight: 1, borderColor: 'grey.500', paddingY: 0.5 }}>
                    {String.fromCharCode(65 + sectionIndex)} {/* A, B, C, D */}
                  </TableCell>
                  <TableCell colSpan={4} sx={{ paddingY: 0.5 }}>
                    {section.title}
                  </TableCell>
                </TableRow>
                {/* Strategy Rows */}
                {section.strategies.map((strategy, strategyIndex) => (
                  <TableRow
                    key={`${sectionIndex}-${strategy.id}`}
                    sx={{ '& td, & th': { borderRight: 1, borderColor: 'divider', paddingY: 0.25 }, '&:last-child td, &:last-child th': { borderBottom: 0 } }}
                  >
                    <TableCell align="center" component="th" scope="row" sx={{ paddingY: 0.25 }}>
                      {strategy.id}
                    </TableCell>
                     {/* Placeholder for strategy description - Replace with TextField later */}
                    <TableCell sx={{ padding: 0.25 }}> {/* Further reduced padding */}
                      <TextField
                        fullWidth
                        variant="outlined" // Use outlined variant
                        size="small" // Make it compact
                        value={strategy.description}
                        onChange={(e) => handleDescriptionChange(sectionIndex, strategyIndex, e.target.value)}
                        placeholder="Enter strategy description..."
                        InputProps={{
                          sx: { fontSize: '0.8rem' } // Slightly reduced font size
                        }}
                      />
                    </TableCell>
                    {/* Checkbox Cells */}
                    <TableCell align="center" sx={{ padding: 0 }}> {/* Keep padding 0 */}
                      <Checkbox
                        checked={strategy.shortenCycle}
                        onChange={() => handleCheckboxChange(sectionIndex, strategyIndex, 'shortenCycle')}
                        inputProps={{ 'aria-label': `Shorten Cycle Times for ${section.title} strategy ${strategy.id}` }}
                        sx={{ padding: 0.25 }} // Reduced padding
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ padding: 0 }}>
                      <Checkbox
                        checked={strategy.eliminateMistakes}
                        onChange={() => handleCheckboxChange(sectionIndex, strategyIndex, 'eliminateMistakes')}
                        inputProps={{ 'aria-label': `Eliminate Mistakes for ${section.title} strategy ${strategy.id}` }}
                        sx={{ padding: 0.25 }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ padding: 0 }}>
                      <Checkbox
                        checked={strategy.improveModel}
                        onChange={() => handleCheckboxChange(sectionIndex, strategyIndex, 'improveModel')}
                        inputProps={{ 'aria-label': `Improve Business Model & P/L for ${section.title} strategy ${strategy.id}` }}
                        sx={{ padding: 0.25 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CashAccelerationStrategies;
