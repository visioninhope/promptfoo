import React from 'react';
import Link from '@docusaurus/Link';
import { useColorMode } from '@docusaurus/theme-common';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Layout from '@theme/Layout';

// --- Types ---

// TeamMember Interface with simplified title as string
interface TeamMember {
  name: string;
  title: string;
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

// Investor Interface
interface Investor {
  name: string;
  image: string;
  description: string;
}

// --- Component Implementation ---

const AboutPageContent = () => {
  // Get current color mode from Docusaurus
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';

  // Theme setup with responsive colors - simplified
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          // Remove explicit primary/background/text color overrides to use Material UI defaults
        },
        typography: {
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
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
              root: { borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: { textTransform: 'none', fontWeight: 500 },
            },
          },
        },
      }),
    [isDarkMode],
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
      },
    },
    {
      name: "Michael D'Angelo",
      title: 'CTO & Co-founder',
      image: '/img/team/michael.jpeg',
      bio: 'Michael is the former VP of Engineering and Head of AI at SmileID, where he scaled ML solutions to serve over 200M people across hundreds of enterprises.',
      socials: {
        linkedin: 'https://www.linkedin.com/in/michaelldangelo/',
        github: 'https://github.com/mldangelo',
      },
    },
  ];

  const teamMembers: TeamMember[] = [
    {
      name: 'Steve Klein',
      title: 'Staff Engineer',
      image: '/img/team/steve.jpeg',
      bio: 'Steve brings decades of expertise in engineering, product, and cybersecurity. He has led technical and product teams, and conducted pentests at companies like Microsoft, Shopify, Intercom, and PwC. Most recently he was scaling AI products at Discord.',
      socials: {
        linkedin: 'https://www.linkedin.com/in/sklein12/',
        github: 'https://github.com/sklein12',
      },
    },
    {
      name: 'Matthew Bou',
      title: 'Enterprise GTM Lead',
      image: '/img/team/matt.jpeg',
      bio: "Matt's a three-time founding sales team member with a track record of building GTM from scratch. He's helped startups land and grow Fortune 500 accounts, leading to three exits. At Promptfoo, he leads enterprise sales, helping teams accelerate and secure LLMs.",
      socials: { linkedin: 'https://www.linkedin.com/in/mattbou/' },
    },
    {
      name: 'Ben Shipley',
      title: 'Enterprise GTM Lead',
      image: '/img/team/ben.jpeg',
      bio: 'Ben brings go-to-market expertise as an early GTM hire at multiple high-growth startups including Windsurf, Applied Intuition, and Amplitude. He specializes in building strategic relationships and helping enterprises implement and secure their AI solutions.',
      socials: { linkedin: 'https://www.linkedin.com/in/ben-shipley-069517101' },
    },
    {
      name: 'Vanessa Sauter',
      title: 'Principal Solutions Architect',
      image: '/img/team/vanessa.jpeg',
      bio: 'Vanessa led hundreds of security and privacy reviews for customers at Gong. She has also pentested dozens of enterprises and launched hundreds of bug bounty programs for a leading crowdsourced security company and is published in Forbes, Lawfare, and Dark Reading.',
      socials: {
        linkedin: 'https://www.linkedin.com/in/vsauter/',
        github: 'https://github.com/vsauter',
      },
    },
    {
      name: 'Guangshuo Zang',
      title: 'Staff Engineer',
      image: '/img/team/shuo.jpeg',
      bio: 'Guangshuo brings technical expertise from Meta, ChipperCash, and Smile Identity. Specializes in GenAI systems, product engineering, and building scalable client solutions.',
      socials: {
        linkedin: 'https://www.linkedin.com/in/guangshuo-zang-23455361/',
        github: 'https://github.com/shuzang',
      },
    },
    {
      name: 'Faizan Minhas',
      title: 'Senior Engineer',
      image: '/img/team/faizan.jpeg',
      bio: 'Faizan brings a wealth of experience in building products across a range of industries. He has led and contributed to projects at companies like Faire, Intercom, and a range of startups.',
      socials: {
        linkedin: 'https://www.linkedin.com/in/faizan-m-54157b113/',
        github: 'https://github.com/faizanminhas',
      },
    },
    {
      name: 'Will Holley',
      title: 'Senior Engineer',
      image: '/img/team/will.jpg',
      bio: 'Will has a passion for building secure and reliable systems. He brings experience leading teams that develop AI for the financial services industry.',
      socials: {
        linkedin: 'https://www.linkedin.com/in/waholley/',
        github: 'https://github.com/will-holley',
      },
    },
    {
      name: 'Asmi Gulati',
      title: 'AI Red Team',
      image: '/img/team/asmi.jpeg',
      bio: 'Asmi specializes in prompt hacking and develops educational content for Promptfoo. In her free time she maintains https://aisimplyexplained.com/',
      socials: {
        linkedin: 'https://www.linkedin.com/in/asmi-gulati/',
        github: 'https://github.com/AISimplyExplained',
      },
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

  // --- Components ---

  // TeamMemberCard component
  const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member }) => (
    <Box
      sx={{
        height: '100%',
        borderRadius: '8px',
        boxShadow: theme.shadows[1],
        transition: 'all 0.2s ease-in-out',
        padding: 3,
        textAlign: 'center',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[3],
        },
      }}
    >
      <Box sx={{ position: 'relative', mb: 2.5, display: 'flex', justifyContent: 'center' }}>
        <img
          src={member.image}
          alt={member.name}
          style={{
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
          }}
        />
      </Box>
      
      <Typography variant="h6" component="h3" sx={{ mb: 0.5, fontWeight: 600 }}>
        {member.name}
      </Typography>
      
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {member.title}
      </Typography>
      
      {/* Social links */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, gap: 1 }}>
        {member.socials?.github && (
          <IconButton
            aria-label={`GitHub profile of ${member.name}`}
            href={member.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: isDarkMode ? 'white' : 'rgba(0, 0, 0, 0.7)',
              padding: '6px',
              '&:hover': { 
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            <GitHubIcon sx={{ fontSize: '18px' }} />
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
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: isDarkMode ? 'white' : 'rgba(0, 0, 0, 0.7)',
              padding: '6px',
              '&:hover': { 
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            <LinkedInIcon sx={{ fontSize: '18px' }} />
          </IconButton>
        )}
      </Box>
      
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}
      >
        {member.bio}
      </Typography>
    </Box>
  );

  // --- Render ---

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', color: 'text.primary' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          {/* Hero Section */}
          <Box
            sx={{
              textAlign: 'center',
              mb: { xs: 8, md: 10 },
            }}
          >
            <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
              Securing the Future of AI
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: '650px', mx: 'auto', fontSize: '1.1rem' }}
            >
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
                  We are security and engineering practitioners who have scaled generative AI
                  products to hundreds of millions of users. We're building the tools that we wished
                  we had when we were on the front lines.
                </Typography>
                <Typography variant="body1">
                  Based in San Mateo, California, we're backed by Andreessen Horowitz and top
                  leaders in the technology and security industries.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <img
                      src="/img/logo-panda.svg"
                      alt="Promptfoo Logo"
                      style={{
                        width: '180px',
                        height: 'auto',
                        filter: isDarkMode
                          ? 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))'
                          : 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.1))',
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: { xs: 6, md: 8 } }} />

          {/* Founders Section */}
          <Box mb={{ xs: 8, md: 10 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                Our Founders
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: '600px', mx: 'auto' }}
              >
                Meet the leadership building the future of AI security
              </Typography>
            </Box>
            <Grid container spacing={4} justifyContent="center">
              {founders.map((founder) => (
                <Grid size={{ xs: 12, sm: 5, md: 4 }} key={founder.name}>
                  <Box sx={{ maxWidth: '360px', mx: 'auto' }}>
                    <TeamMemberCard member={founder} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: { xs: 6, md: 8 } }} />

          {/* Team Members Section */}
          <Box mb={{ xs: 8, md: 10 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                Our Team
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: '600px', mx: 'auto' }}
              >
                Experts in AI, security, and enterprise software
              </Typography>
            </Box>

            <Grid container spacing={4} justifyContent="center">
              {teamMembers.map((member) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={member.name}>
                  <TeamMemberCard member={member} />
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: { xs: 6, md: 8 } }} />

          {/* Backed by Industry Leaders */}
          <Box mb={{ xs: 8, md: 10 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                Backed by Industry Leaders
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: '600px', mx: 'auto' }}
              >
                We're honored to have the support of top investors and industry experts
              </Typography>
            </Box>
            <Grid container spacing={4} justifyContent="center">
              {investors.map((investor) => (
                <Grid size={{ xs: 6, sm: 4, md: 2 }} key={investor.name}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      height: '100%',
                      px: 1,
                    }}
                  >
                    <Box
                      component="img"
                      src={investor.image}
                      alt={investor.name}
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        mb: 2,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      }}
                    />
                    <Typography
                      variant="subtitle1"
                      component="h4"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {investor.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        whiteSpace: 'pre-line',
                        lineHeight: 1.4,
                        minHeight: 42, // Provide consistent height for the description
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {investor.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: { xs: 6, md: 8 } }} />

          {/* Open Source Community */}
          <Box mb={{ xs: 8, md: 10 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
                An Incredible Open Source Community
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ maxWidth: '600px', mx: 'auto' }}
              >
                Promptfoo is proud to be supported by a vibrant community of over 150 open source
                contributors.
              </Typography>
            </Box>
            <Box display="flex" justifyContent="center">
              <a href="https://github.com/promptfoo/promptfoo/graphs/contributors">
                <img
                  src="https://contrib.rocks/image?repo=promptfoo/promptfoo"
                  alt="Promptfoo Contributors"
                  style={{ borderRadius: '8px', maxWidth: '100%', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}
                />
              </a>
            </Box>
          </Box>

          {/* Call to Action */}
          <Box
            sx={{
              textAlign: 'center',
              mb: 6,
              py: 8,
              px: { xs: 4, md: 6 },
              borderRadius: 3,
              maxWidth: '800px',
              mx: 'auto',
              boxShadow: theme.shadows[2],
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
              background: isDarkMode 
                ? 'linear-gradient(145deg, rgba(19, 35, 57, 0.6) 0%, transparent 100%)'
                : 'linear-gradient(145deg, rgba(247, 249, 252, 0.7) 0%, transparent 100%)',
              overflow: 'hidden',
            }}
          >
            {/* Subtle decorative element */}
            <Box 
              sx={{ 
                position: 'absolute', 
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(53, 120, 229, 0.05) 0%, transparent 70%)',
                top: '-150px',
                right: '-150px',
                zIndex: 0,
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h2" component="h2" mb={3} sx={{ fontWeight: 700 }}>
                Ready to Secure Your AI Applications?
              </Typography>

              <Typography
                variant="body1"
                mb={5}
                color="text.secondary"
                sx={{
                  maxWidth: '600px',
                  mx: 'auto',
                  fontSize: '1.05rem',
                }}
              >
                Join leading enterprises who trust Promptfoo to fortify their AI applications.
              </Typography>

              <Link
                className="button button--primary button--lg"
                to="/contact/"
                style={{
                  padding: '10px 32px',
                  fontWeight: 600,
                }}
              >
                Get in Touch
              </Link>
            </Box>
            
            {/* Subtle bottom decorative element */}
            <Box 
              sx={{ 
                position: 'absolute', 
                width: '250px',
                height: '250px',
                background: 'radial-gradient(circle, rgba(53, 120, 229, 0.03) 0%, transparent 70%)',
                bottom: '-100px',
                left: '-100px',
                zIndex: 0,
              }}
            />
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
