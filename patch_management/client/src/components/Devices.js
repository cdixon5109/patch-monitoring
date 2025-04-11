import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';

const columns = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Device Name', width: 200 },
  { field: 'ip', headerName: 'IP Address', width: 130 },
  { field: 'os', headerName: 'Operating System', width: 130 },
  { field: 'lastSeen', headerName: 'Last Seen', width: 160 },
  { field: 'status', headerName: 'Status', width: 130 },
  { field: 'patchesPending', headerName: 'Pending Patches', width: 130 },
];

const rows = [
  {
    id: 1,
    name: 'Workstation-01',
    ip: '192.168.1.100',
    os: 'Windows 10',
    lastSeen: '2023-04-10 14:30',
    status: 'Online',
    patchesPending: 3,
  },
  {
    id: 2,
    name: 'Server-01',
    ip: '192.168.1.101',
    os: 'Windows Server 2019',
    lastSeen: '2023-04-10 14:25',
    status: 'Online',
    patchesPending: 2,
  },
  {
    id: 3,
    name: 'Linux-Server',
    ip: '192.168.1.102',
    os: 'Ubuntu 20.04',
    lastSeen: '2023-04-10 14:20',
    status: 'Online',
    patchesPending: 1,
  },
];

function Devices() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Devices</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => console.log('Add device clicked')}
        >
          Add Device
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

export default Devices; 