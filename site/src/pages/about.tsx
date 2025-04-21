import React from 'react';
import Link from '@docusaurus/Link';
import { useColorMode } from '@docusaurus/theme-common';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Layout from '@theme/Layout';

interface TeamMember {
  name: string;
  title: string;
  image: string;
  bio: string;
}

interface TeamMemberCardProps {
  member: TeamMember;
  linkedInUrl?: string;
}

const AboutPageContent = () => {
  const { colorMode } = useColorMode();

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: colorMode === 'dark' ? 'dark' : 'light',
        },
      }),
    [colorMode],
  );

  // LinkedIn URLs for team members
  const linkedInUrls = {
    'Ian Webster': 'https://www.linkedin.com/in/ianww/',
    "Michael D'Angelo": 'https://www.linkedin.com/in/michaelldangelo/',
    'Matthew Bou': 'https://www.linkedin.com/in/mattbou/',
    'Ben Shipley': 'https://www.linkedin.com/in/ben-shipley-069517101',
    'Vanessa Sauter': 'https://www.linkedin.com/in/vsauter/',
    'Guangshuo Zang': 'https://www.linkedin.com/in/guangshuo-zang-23455361/',
    'Faizan Minhas': 'https://www.linkedin.com/in/faizan-m-54157b113/',
    'Will Holley': 'https://www.linkedin.com/in/waholley/',
    'Asmi Gulati': 'https://www.linkedin.com/in/asmi-gulati/',
    'Steve Klein': 'https://www.linkedin.com/in/',
  };

  // Define co-founders
  const founders: TeamMember[] = [
    {
      name: 'Ian Webster',
      title: 'CEO & Co-founder',
      image: '/img/team/ian.jpeg',
      bio: 'Ian previously led LLM engineering and developer platform teams at Discord, scaling AI products to 200M users while maintaining rigorous safety, security, and policy standards.',
    },
    {
      name: "Michael D'Angelo",
      title: 'CTO & Co-founder',
      image: '/img/team/michael.jpeg',
      bio: 'Michael brings extensive experience in AI and engineering leadership. As the former VP of Engineering and Head of AI at Smile Identity, he has a track record of scaling ML solutions to serve over 100 million people across hundreds of enterprises.',
    },
  ];

  // Define team members (everyone else)
  const teamMembers: TeamMember[] = [
    {
      name: 'Steve Klein',
      title: 'Staff Engineer',
      image: '/img/team/steve.jpeg',
      bio: `Steve brings decades of expertise in engineering, product, and cybersecurity. He has led technical and product teams, and conducted pentests at companies like Microsoft, Shopify, Intercom, and PwC.`,
    },
    {
      name: 'Matthew Bou',
      title: 'Enterprise GTM Lead',
      image: '/img/team/matt.jpeg',
      bio: "Matt's a three-time founding sales team member with a track record of building GTM from scratch. He's helped startups land and grow Fortune 500 accounts, leading to three exits.",
    },
    {
      name: 'Ben Shipley',
      title: 'Enterprise GTM Lead',
      image: '/img/team/ben.jpeg',
      bio: 'Ben brings go-to-market expertise as an early GTM hire at multiple high-growth startups including Windsurf, Applied Intuition, and Amplitude. He specializes in building strategic relationships.',
    },
    {
      name: 'Vanessa Sauter',
      title: 'Principal Solutions Architect',
      image: '/img/team/vanessa.jpeg',
      bio: 'Vanessa led hundreds of security and privacy reviews for customers at Gong. She has also pentested dozens of enterprises and launched hundreds of bug bounty programs for a leading crowdsourced security company.',
    },
    {
      name: 'Guangshuo Zang',
      title: 'Staff Engineer',
      image: '/img/team/shuo.jpeg',
      bio: 'Guangshuo brings technical expertise from Meta, ChipperCash, and Smile Identity. Specializes in GenAI systems, product engineering, and building scalable client solutions.',
    },
    {
      name: 'Faizan Minhas',
      title: 'Senior Engineer',
      image: '/img/team/faizan.jpeg',
      bio: 'Faizan brings a wealth of experience in building products across a range of industries. He has led and contributed to projects at companies like Faire, Intercom, and a range of startups.',
    },
    {
      name: 'Will Holley',
      title: 'Senior Engineer',
      image: '/img/team/will.jpg',
      bio: 'Will has a passion for building secure and reliable systems. He brings experience leading teams that develop AI for the financial services industry.',
    },
    {
      name: 'Asmi Gulati',
      title: 'AI Red Team',
      image: '/img/team/asmi.jpeg',
      bio: 'Asmi specializes in prompt hacking and develops educational content for Promptfoo. In her free time she maintains https://aisimplyexplained.com/',
    },
  ];

  // Team member card component with simplified styling
  const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, linkedInUrl }) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ position: 'relative', mb: 2 }}>
        <img
          src={member.image}
          alt={member.name}
          style={{
            width: '100%',
            borderRadius: '4px',
            aspectRatio: '1 / 1',
            objectFit: 'cover',
          }}
        />
        {linkedInUrl && (
          <IconButton
            aria-label={`LinkedIn profile of ${member.name}`}
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              color: '#0a66c2',
              padding: '4px',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
            }}
          >
            <LinkedInIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Typography variant="h6" component="h3" fontWeight="medium" gutterBottom>
        {member.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {member.title}
      </Typography>
      <Typography variant="body2">{member.bio}</Typography>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Securing the Future of AI
          </Typography>
          <Typography variant="h6" component="h2" color="text.secondary">
            Promptfoo helps developers and enterprises build secure, reliable AI applications.
          </Typography>
        </Box>

        <Box mb={6}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="h5" component="h3" gutterBottom fontWeight="medium">
                About Us
              </Typography>
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
            <Grid size={{ xs: 12, md: 5 }}>
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <img
                  src="/img/logo-panda.svg"
                  alt="Promptfoo Logo"
                  style={{ maxWidth: '100%', maxHeight: '120px', height: 'auto' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Founders Section - 2 columns */}
        <Box mb={6}>
          <Typography variant="h5" component="h3" align="center" mb={1} fontWeight="medium">
            Our Founders
          </Typography>
          <Typography variant="body2" align="center" mb={4} color="text.secondary">
            Meet the leadership building the future of AI security
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {founders.map((founder) => (
              <Grid size={{ xs: 12, sm: 6 }} key={founder.name}>
                <TeamMemberCard member={founder} linkedInUrl={linkedInUrls[founder.name]} />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Team Members Section - 4 columns */}
        <Box mb={6}>
          <Typography variant="h5" component="h3" align="center" mb={1} fontWeight="medium">
            Our Team
          </Typography>
          <Typography variant="body2" align="center" mb={4} color="text.secondary">
            Experts in AI, security, and enterprise software
          </Typography>
          <Grid container spacing={3}>
            {teamMembers.map((member) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={member.name}>
                <TeamMemberCard member={member} linkedInUrl={linkedInUrls[member.name]} />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        <Box mb={6}>
          <Typography variant="h5" component="h3" align="center" mb={1} fontWeight="medium">
            Backed by Industry Leaders
          </Typography>
          <Typography variant="body2" align="center" mb={4} color="text.secondary">
            We're honored to have the support of top investors and industry experts
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {[
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
            ].map((investor) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={investor.name}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box
                    component="img"
                    src={investor.image}
                    alt={investor.name}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      mb: 1,
                      mx: 'auto',
                      display: 'block',
                    }}
                  />
                  <Typography variant="subtitle2" component="h4" fontWeight="medium">
                    {investor.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {investor.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        <Box mb={6}>
          <Typography variant="h5" component="h3" align="center" mb={1} fontWeight="medium">
            An Incredible Open Source Community
          </Typography>
          <Typography variant="body2" align="center" mb={4}>
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

        <Box textAlign="center" mb={4}>
          <Typography variant="h5" component="h3" mb={1} fontWeight="medium">
            Ready to Secure Your AI Applications?
          </Typography>
          <Typography variant="body2" mb={3}>
            Join leading enterprises who trust Promptfoo to fortify their AI applications.
          </Typography>
          <Link
            className="button button--primary button--lg"
            to="/contact/"
            style={{
              borderRadius: '4px',
              padding: '8px 24px',
              fontWeight: 500,
            }}
          >
            Get in Touch
          </Link>
        </Box>
      </Container>
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
