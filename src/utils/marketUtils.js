export const groupMarkets = (markets) => {
  const grouped = {};
  const result = [];
  
  markets.forEach(m => {
    const match = m.question.match(/^\[GROUP:(.+?)\] (.*)$/);
    if (match) {
      const groupId = match[1];
      if (!grouped[groupId]) {
        let rawTitle = groupId;
        if (rawTitle.toLowerCase().startsWith('breaking-')) {
          rawTitle = rawTitle.slice(9);
        }
        let formattedTitle = rawTitle;
        if (!rawTitle.includes(' ') && rawTitle.includes('-')) {
           formattedTitle = rawTitle.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else {
           formattedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        }

        grouped[groupId] = {
          isGroup: true,
          id: groupId,
          title: formattedTitle,
          category: m.category,
          image_url: m.image_url,
          options: []
        };
        result.push(grouped[groupId]);
      }
      grouped[groupId].options.push({
        ...m,
        optionName: match[2]
      });
    } else {
      result.push({ isGroup: false, ...m });
    }
  });
  
  result.forEach(item => {
    if (item.isGroup && item.options.length > 0) {
      // A robust way to extract Title and Options is splitting by `?`
      // since all market questions are formatted as "Question? Option Date"
      const sampleOption = item.options[0].optionName;
      const qMarkIndex = sampleOption.lastIndexOf('?');
      
      if (qMarkIndex !== -1 && qMarkIndex < sampleOption.length - 1) {
        // The title is everything up to and including the last '?' before options
        item.title = sampleOption.substring(0, qMarkIndex + 1).trim();
        
        // The option name is everything after the '?'
        item.options = item.options.map(opt => {
          // If this option also has a ?, split there, else fallback to full string
          const optQMark = opt.optionName.lastIndexOf('?');
          let shortName = opt.optionName;
          if (optQMark !== -1 && optQMark < opt.optionName.length - 1) {
             shortName = opt.optionName.substring(optQMark + 1).trim();
          }
          
          // Optionally strip leading "By " if we just want the date
          if (shortName.toLowerCase().startsWith('by ')) {
             shortName = shortName.substring(3).trim();
          }
          
          // Capitalize first letter
          if (shortName.length > 0) {
            shortName = shortName.charAt(0).toUpperCase() + shortName.slice(1);
          }
          return { ...opt, name: shortName || opt.optionName };
        });
      } else {
        // Fallback: just use optionName as name if no question mark separator
        item.options = item.options.map(opt => ({ ...opt, name: opt.optionName }));
      }

      item.options.sort((a, b) => b.yes - a.yes);
    }
  });
  
  return result;
};

export const calculateSmoothedPercentages = (yesVotes, noVotes, smoothingFactor = 10) => {
  const smoothedYes = (yesVotes || 0) + smoothingFactor;
  const smoothedNo = (noVotes || 0) + smoothingFactor;
  const totalSmoothed = smoothedYes + smoothedNo;
  
  const yes = Math.round((smoothedYes / totalSmoothed) * 100);
  const no = 100 - yes;
  
  return { yes, no, totalVotes: (yesVotes || 0) + (noVotes || 0) };
};

export const getTrueVolume = (houseYes, houseNo) => {
  const total = (houseYes || 0) + (houseNo || 0);
  // Base liquidity is now 50 across all markets
  if (total >= 50) return total - 50;
  return total;
};
