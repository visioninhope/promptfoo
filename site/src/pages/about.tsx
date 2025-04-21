import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import Layout from '@theme/Layout';

// --- Enhanced Types ---

// 1. Specific Roles
type Role = 
  | 'CEO & Co-founder' 
  | 'CTO & Co-founder' 
  | 'Staff Engineer' 
  | 'Enterprise GTM Lead' 
  | 'Principal Solutions Architect' 
  | 'Senior Engineer' 
  | 'AI Red Team';

// 2. Filter Categories Type
type FilterCategory = 'all' | 'engineering' | 'business';

// 3. Role-to-Category Mapping
const roleCategoryMapping: { [key in Role]?: FilterCategory[] } = {
  'CEO & Co-founder': ['business'],
  'CTO & Co-founder': ['engineering'],
  'Staff Engineer': ['engineering'],
  'Enterprise GTM Lead': ['business'],
  'Principal Solutions Architect': ['business'],
  'Senior Engineer': ['engineering'],
  'AI Red Team': ['engineering'],
};

// 4. TeamMember Interface (using Role)
interface TeamMember {
  name: string;
  title: Role;
  image: string;
  bio: string;
  socials?: {
    linkedin?: string;
    github?: string;
  };
}

interface TeamMemberCardProps {
  member: TeamMember;
}

// 5. Investor Interface
interface Investor {
  name: string;
  image: string;
  description: string;
}

// --- Component Implementation ---

const AboutPageContent = () => {
  // Explicitly typed state using FilterCategory
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  
  // Force dark mode for this page
  const isDark = true;

  // Theme setup remains the same
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark',
          primary: {
            main: '#3578e5',
          },
          background: {
            default: '#0e1c2b',
            paper: '#132339',
          },
          text: {
            primary: '#e2e8f0',
            secondary: '#94a3b8',
          },
        },
        typography: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          h2: { fontSize: '2.25rem', fontWeight: 600, lineHeight: 1.3 },
          h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
          h5: { fontSize: '1.125rem', fontWeight: 600 },
          h6: { fontSize: '1rem', fontWeight: 600 },
          body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
          body2: { fontSize: '0.875rem', lineHeight: 1.5 },
          subtitle2: { fontSize: '0.8rem', fontWeight: 500 },
          caption: { fontSize: '0.7rem', lineHeight: 1.4 }
        },
        components: {
          MuiDivider: {
            styleOverrides: {
              root: { borderColor: 'rgba(255, 255, 255, 0.1)' },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: { textTransform: 'none', fontWeight: 500 },
            },
          },
        },
      }),
    [],
  );

  // --- Data Definitions ---

  const founders: TeamMember[] = [
    {
      name: 'Ian Webster',
      title: 'CEO & Co-founder',
      image: '/img/team/ian.jpeg',
      bio: 'Ian previously led LLM engineering and developer platform teams at Discord, scaling AI products to 200M users while maintaining rigorous safety, security, and policy standards.',
      socials: {
        linkedin: 'https://www.linkedin.com/in/ianww/',
        github: 'https://github.com/typpo',
      }
    },
    {
      name: "Michael D'Angelo",
      title: 'CTO & Co-founder',
      image: '/img/team/michael.jpeg',
      bio: 'Michael brings extensive experience in AI and engineering leadership. As the former VP of Engineering and Head of AI at Smile Identity, he has a track record of scaling ML solutions to serve over 100 million people.',
      socials: {
        linkedin: 'https://www.linkedin.com/in/michaelldangelo/',
        github: 'https://github.com/mldangelo',
      }
    },
  ];

  const teamMembers: TeamMember[] = [
    {
      name: 'Steve Klein',
      title: 'Staff Engineer',
      image: '/img/team/steve.jpeg',
      bio: 'Steve brings decades of expertise in engineering, product, and cybersecurity. He has led technical teams at Microsoft, Shopify, Intercom, and PwC.',
      socials: { linkedin: 'https://www.linkedin.com/in/' }
    },
    {
      name: 'Matthew Bou',
      title: 'Enterprise GTM Lead',
      image: '/img/team/matt.jpeg',
      bio: "Matt's a three-time founding sales team member with a track record of building GTM from scratch. He's helped startups land and grow Fortune 500 accounts.",
      socials: { linkedin: 'https://www.linkedin.com/in/mattbou/' }
    },
    {
      name: 'Ben Shipley',
      title: 'Enterprise GTM Lead',
      image: '/img/team/ben.jpeg',
      bio: 'Ben brings go-to-market expertise as an early GTM hire at multiple high-growth startups including Windsurf, Applied Intuition, and Amplitude.',
      socials: { linkedin: 'https://www.linkedin.com/in/ben-shipley-069517101' }
    },
    {
      name: 'Vanessa Sauter',
      title: 'Principal Solutions Architect',
      image: '/img/team/vanessa.jpeg',
      bio: 'Vanessa led hundreds of security and privacy reviews for customers at Gong. She has also pentested dozens of enterprises and launched hundreds of bug bounty programs.',
      socials: { linkedin: 'https://www.linkedin.com/in/vsauter/' }
    },
    {
      name: 'Guangshuo Zang',
      title: 'Staff Engineer',
      image: '/img/team/shuo.jpeg',
      bio: 'Guangshuo brings technical expertise from Meta, ChipperCash, and Smile Identity. Specializes in GenAI systems and product engineering.',
      socials: { linkedin: 'https://www.linkedin.com/in/guangshuo-zang-23455361/', github: 'https://github.com/shuzang' }
    },
    {
      name: 'Faizan Minhas',
      title: 'Senior Engineer',
      image: '/img/team/faizan.jpeg',
      bio: 'Faizan brings a wealth of experience in building products across industries. He has led projects at Faire, Intercom, and various startups.',
      socials: { linkedin: 'https://www.linkedin.com/in/faizan-m-54157b113/' }
    },
    {
      name: 'Will Holley',
      title: 'Senior Engineer',
      image: '/img/team/will.jpg',
      bio: 'Will has a passion for building secure and reliable systems. He brings experience leading teams that develop AI for the financial services industry.',
      socials: { linkedin: 'https://www.linkedin.com/in/waholley/' }
    },
    {
      name: 'Asmi Gulati',
      title: 'AI Red Team',
      image: '/img/team/asmi.jpeg',
      bio: 'Asmi specializes in prompt hacking and develops educational content for Promptfoo. In her free time she maintains aisimplyexplained.com.',
      socials: { linkedin: 'https://www.linkedin.com/in/asmi-gulati/', github: 'https://github.com/asmigulati' }
    },
  ];

  const investors: Investor[] = [
    {
      name: 'Zane Lackey',
      image: '/img/team/zane.jpeg',
      description: 'General Partner, Andreessen Horowitz\nFounder, Signal Sciences',
    },
    {
      name: 'Joel de la Garza',
      image: '/img/team/joel.jpeg',
      description: 'Investment Partner, Andreessen Horowitz\nCISO, Box',
    },
    {
      name: 'Tobi Lutke',
      image: '/img/team/tobi.jpeg',
      description: 'CEO, Shopify',
    },
    {
      name: 'Stanislav Vishnevskiy',
      image: '/img/team/stan.jpeg',
      description: 'CTO, Discord',
    },
    {
      name: 'Frederic Kerrest',
      image: '/img/team/frederic.jpeg',
      description: 'Vice-Chairman & Co-Founder, Okta',
    },
    {
      name: 'Adam Ely',
      image: '/img/team/adam.jpeg',
      description: 'EVP, Head of Digital Products, Fidelity\nCISO, Fidelity',
    },
  ];

  // --- Logic ---

  // Simplified filter function using the mapping
  const getFilteredTeam = () => {
    const allTeam = [...founders, ...teamMembers];
    if (activeFilter === 'all') {
      return allTeam;
    }
    return allTeam.filter(member => {
      const categories = roleCategoryMapping[member.title] || [];
      // Ensure founders are correctly included based on their roles
      // This logic handles cases where a role might belong to multiple categories if needed
      return categories.includes(activeFilter);
    });
  };

  // --- Components ---

  // TeamMemberCard component (structure unchanged)
  const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => (
    <Box 
      sx={{ 
        height: '100%', 
        bgcolor: 'background.paper',
        borderRadius: '4px',
        transition: 'background-color 0.2s ease-in-out, transform 0.2s ease-in-out',
        '&:hover': {
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          transform: 'translateY(-2px)',
        }
      }}
    >
      <Box sx={{ position: 'relative', mb: 1.5 }}>
        <img
          src={member.image}
          alt={member.name}
          style={{ 
            width: '100%', 
            aspectRatio: '1 / 1',
            objectFit: 'cover',
            borderRadius: '4px 4px 0 0',
          }}
        />
        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
          {member.socials?.github && (
            <IconButton
              aria-label={`GitHub profile of ${member.name}`}
              href={member.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                padding: '4px',
                width: '26px',
                height: '26px',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
              }}
            >
              <GitHubIcon sx={{ fontSize: '14px' }} />
            </IconButton>
          )}
          {member.socials?.linkedin && (
            <IconButton
              aria-label={`LinkedIn profile of ${member.name}`}
              href={member.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                padding: '4px',
                width: '26px',
                height: '26px',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
              }}
            >
              <LinkedInIcon sx={{ fontSize: '14px' }} />
            </IconButton>
          )}
        </Box>
      </Box>
      <Box sx={{ p: 2 }}> 
        <Typography variant="h6" component="h3" sx={{ mb: 0.25 }}>
          {member.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {member.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
          {member.bio}
        </Typography>
      </Box>
    </Box>
  );

  // --- Render ---

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          {/* Hero Section */}
          <Box 
            sx={{ 
              textAlign: 'center', 
              mb: { xs: 8, md: 10 },
            }}
          >
            <Typography variant="h2" component="h1" gutterBottom>
              Securing the Future of AI
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '650px', mx: 'auto' }}>
              Promptfoo helps developers and enterprises build secure, reliable AI applications.
            </Typography>
          </Box>

          {/* About Us Section */}
          <Box mb={{ xs: 8, md: 10 }}>
            <Typography variant="h3" component="h2" gutterBottom>
              About Us
            </Typography>
            <Grid container spacing={5} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="body1" paragraph>
                  We are security and engineering practitioners who have scaled generative AI products
                  to hundreds of millions of users. We're building the tools that we wished we had
                  when we were on the front lines.
                </Typography>
                <Typography variant="body1">
                  Based in San Mateo, California, we're backed by Andreessen Horowitz and top leaders
                  in the technology and security industries.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <img
                      src="/img/logo-panda.svg"
                      alt="Promptfoo Logo"
                      style={{ maxWidth: '120px', height: 'auto' }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: { xs: 6, md: 8 } }} />

          {/* Founders Section */}
          <Box mb={{ xs: 8, md: 10 }}>
            <Typography variant="h3" component="h2" align="center" mb={1}>
              Our Founders
            </Typography>
            <Typography variant="body1" align="center" mb={5} color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
              Meet the leadership building the future of AI security
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {founders.map((founder) => (
                <Grid size={{ xs: 12, sm: 6 }} key={founder.name}>
                  <TeamMemberCard member={founder} />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: { xs: 6, md: 8 } }} />

          {/* Team Members Section with Filters */}
          <Box mb={{ xs: 8, md: 10 }}>
            <Typography variant="h3" component="h2" align="center" mb={1}>
              Our Team
            </Typography>
            <Typography variant="body1" align="center" mb={5} color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
              Experts in AI, security, and enterprise software
            </Typography>
            
            {/* Filter tabs using FilterCategory type */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mb: 5, 
                gap: 1.5, 
              }}
            >
              {[
                { id: 'all' as FilterCategory, label: 'All' },
                { id: 'engineering' as FilterCategory, label: 'Engineering' },
                { id: 'business' as FilterCategory, label: 'Business' },
              ].map((filter) => (
                <Box
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && setActiveFilter(filter.id)}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: '20px',
                    bgcolor: activeFilter === filter.id ? theme.palette.primary.main : 'transparent',
                    border: '1px solid',
                    borderColor: activeFilter === filter.id ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.2)',
                    color: activeFilter === filter.id ? '#fff' : theme.palette.text.secondary,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: activeFilter === filter.id ? theme.palette.primary.main : alpha(theme.palette.text.secondary, 0.7),
                      color: '#fff', 
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: '2px',
                    },
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {filter.label}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            <Grid container spacing={4}>
              {getFilteredTeam().map((member) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={member.name}>
                  <TeamMemberCard member={member} />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: { xs: 6, md: 8 } }} />

          {/* Backed by Industry Leaders */}
          <Box mb={{ xs: 8, md: 10 }}>
            <Typography variant="h3" component="h2" align="center" mb={1}>
              Backed by Industry Leaders
            </Typography>
            <Typography variant="body1" align="center" mb={6} color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto' }}>
              We're honored to have the support of top investors and industry experts
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: { xs: 4, sm: 6 }, 
              }}
            >
              {investors.map((investor) => (
                <Box 
                  key={investor.name} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    width: { xs: '100px', sm: '110px' },
                    textAlign: 'center'
                  }}
                >
                  <Box
                    component="img"
                    src={investor.image}
                    alt={investor.name}
                    sx={{ width: 64, height: 64, borderRadius: '50%', mb: 1.5 }}
                  />
                  <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 500, mb: 0.25 }}>
                    {investor.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-line', lineHeight: 1.3 }}
                  >
                    {investor.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: { xs: 6, md: 8 } }} />

          {/* Open Source Community */}
          <Box mb={{ xs: 8, md: 10 }}>
            <Typography variant="h3" component="h2" align="center" mb={1}>
              An Incredible Open Source Community
            </Typography>
            <Typography variant="body1" align="center" mb={5} sx={{ maxWidth: '600px', mx: 'auto' }}>
              Promptfoo is proud to be supported by a vibrant community of over 150 open source
              contributors.
            </Typography>
            <Box display="flex" justifyContent="center">
              <a href="https://github.com/promptfoo/promptfoo/graphs/contributors">
                <img
                  src="https://contrib.rocks/image?repo=promptfoo/promptfoo"
                  alt="Promptfoo Contributors"
                  style={{ borderRadius: '4px', maxWidth: '100%' }}
                />
              </a>
            </Box>
          </Box>

          {/* Call to Action */}
          <Box 
            sx={{
              textAlign: 'center', 
              mb: 4,
              py: 6, 
              px: 4,
              borderRadius: 2,
              bgcolor: 'background.paper',
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            <Typography variant="h3" component="h2" mb={2}>
              Ready to Secure Your AI Applications?
            </Typography>
            <Typography variant="body1" mb={4} color="text.secondary">
              Join leading enterprises who trust Promptfoo to fortify their AI applications.
            </Typography>
            <Link 
              className="button button--primary button--lg" 
              to="/contact/"
              style={{
                background: theme.palette.primary.main,
                color: '#fff',
                padding: '10px 28px',
                fontWeight: 500,
                borderRadius: '20px',
                display: 'inline-block',
                textDecoration: 'none',
              }}
            >
              Get in Touch
            </Link>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

const AboutPage = () => {
  return (
    <Layout
      title="About Promptfoo | AI Security Experts"
      description="Learn about Promptfoo's mission to secure AI applications and our team of industry veterans."
    >
      <AboutPageContent />
    </Layout>
  );
};

export default AboutPage;
