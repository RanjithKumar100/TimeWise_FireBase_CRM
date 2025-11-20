// Consistent color scheme for verticles across the application
export const verticleColors = {
  'CMIS': 'hsla(182, 94%, 47%, 1.00)', // Cyan
  'LOF': 'hsla(221, 100%, 47%, 1.00)',  // Blue
  'TRI': 'hsla(204, 46%, 65%, 1.00)',  // Blue-Purple
  'TRG': 'hsla(239, 96%, 19%, 1.00)',  // Purple
} as const;

export type VerticleType = keyof typeof verticleColors;

export const getVerticleColor = (verticle: string): string => {
  return verticleColors[verticle as VerticleType] || verticleColors['CMIS'];
};

export const getVerticleColorWithOpacity = (verticle: string, opacity: number): string => {
  const color = getVerticleColor(verticle);
  // Convert HSL to HSLA with opacity
  return color.replace('hsl', 'hsla').replace(')', `, ${opacity})`);
};