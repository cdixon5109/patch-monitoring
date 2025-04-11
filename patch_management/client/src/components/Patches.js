import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SecurityIcon from '@mui/icons-material/Security';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Patch Name', width: 200 },
  { field: 'version', headerName: 'Version', width: 130 },
  { field: 'releaseDate', headerName: 'Release Date', width: 130 },
  { field: 'severity', headerName: 'Severity', width: 130 },
  { field: 'affectedSystems', headerName: 'Affected Systems', width: 200 },
  { field: 'status', headerName: 'Status', width: 130 },
];

const rows = [
  {
    id: 1,
    name: 'Windows Security Update',
    version: 'KB5005565',
    releaseDate: '2023-04-01',
    severity: 'Critical',
    affectedSystems: 'Windows 10, Windows Server 2019',
    status: 'Pending',
  },
  {
    id: 2,
    name: 'Adobe Reader Update',
    version: '21.011.20039',
    releaseDate: '2023-04-05',
    severity: 'Important',
    affectedSystems: 'All Windows Systems',
    status: 'Pending',
  },
  {
    id: 3,
    name: 'Linux Kernel Update',
    version: '5.15.0-67',
    releaseDate: '2023-04-08',
    severity: 'High',
    affectedSystems: 'Ubuntu 20.04',
    status: 'Pending',
  },
];

function Patches() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Patches</Typography>
        <Button
          variant="contained"
          startIcon={<SecurityIcon />}
          onClick={() => console.log('Scan for patches clicked')}
        >
          Scan for Patches
        </Button>
      </Box>
      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          checkboxSelection
          disableSelectionOnClick
        />
      </Paper>
    </Box>
  );
}

export default Patches; 