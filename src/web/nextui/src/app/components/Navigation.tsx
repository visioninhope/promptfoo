import { useState } from 'react';
import { USE_SUPABASE } from '@/constants';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EvalSelectorDialog from '../eval/EvalSelectorDialog';
import DarkMode from './DarkMode';
import InfoModal from './InfoModal';
import LoggedInAs from './LoggedInAs';
import Logo from './Logo';
import './Navigation.css';

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname() || '';
  return (
    <Link href={href} className={pathname.startsWith(href) ? 'active' : ''}>
      {label}
    </Link>
  );
}

export default function Navigation({
  darkMode,
  onToggleDarkMode,
}: {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}) {
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [showEvalSelectorDialog, setShowEvalSelectorDialog] = useState<boolean>(false);

  const handleModalToggle = () => setShowInfoModal((prevState) => !prevState);
  const handleEvalSelectorToggle = () => setShowEvalSelectorDialog((prevState) => !prevState);

  const navigationContent = (
    <>
      <Logo />
      {!process.env.NEXT_PUBLIC_NO_BROWSING && (
        <>
          <NavLink href="/setup" label="New Eval" />
          <NavLink href="/eval" label="Evals" />
          <NavLink href="/prompts" label="Prompts" />
          <NavLink href="/datasets" label="Datasets" />
          <NavLink href="/progress" label="Progress" />
        </>
      )}
      <div className="right-aligned">
        <TextField
          size="small"
          placeholder="Search..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onClick={handleEvalSelectorToggle}
        />
        {USE_SUPABASE ? <LoggedInAs /> : null}
        <IconButton onClick={handleModalToggle} sx={{ color: '#f0f0f0' }}>
          <InfoIcon />
        </IconButton>
        <DarkMode darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />
      </div>
    </>
  );

  return (
    <>
      <InfoModal open={showInfoModal} onClose={handleModalToggle} />
      <EvalSelectorDialog
        open={showEvalSelectorDialog}
        onClose={handleEvalSelectorToggle}
        recentEvals={[]} // You'll need to provide the actual recent evals data here
        onRecentEvalSelected={() => {}} // You'll need to implement this function
      />
      <Stack direction="row" spacing={2} className="nav">
        {navigationContent}
      </Stack>
    </>
  );
}
