import { useState, useEffect, useRef } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import LeagueTableCard from './cards/LeagueTableCard';
import MatchStatsCard from './cards/MatchStatsCard';
import FreeBetCard from './cards/FreeBetCard';
import { RatingsCard, VoteCard, ScorersCard, AtAGlanceCard } from './GlanceGroup';

// We will need to extract those components from GlanceGroup or pass them in
