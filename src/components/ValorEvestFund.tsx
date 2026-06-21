import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Lock,
  Sparkles,
  ArrowDownToLine,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

type FundStage = 'setup' | 'forming' | 'accumulating' | 'target-reached';

interface Donor {
  id: number;
  name: string;
  amount: number;
  interestRate: number;
  status: 'invited' | 'joined';
}

const ENTRY_POINTS = [10, 25, 50];

function formatGBP(n: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
}

export default function ValorEvestFund() {
  const [stage, setStage] = useState<FundStage>('accumulating');

  // Setup
  const [targetValue, setTargetValue] = useState(420000);
  const [riskPct, setRiskPct] = useState(15);
  const [entryPct, setEntryPct] = useState(25);

  // Donors (mock)
  const [donors, setDonors] = useState<Donor[]>([
    { id: 1, name: 'Aunt Margaret', amount: 15000, interestRate: 3.5, status: 'joined' },
    { id: 2, name: 'Tom (brother)', amount: 8000, interestRate: 3.5, status: 'joined' },
    { id: 3, name: 'Priya', amount: 0, interestRate: 3.5, status: 'invited' },
  ]);
  const [inviteName, setInviteName] = useState('');
  const [inviteAmount, setInviteAmount] = useState('');

  // Accumulation (mock)
  const lumpSum = Math.round((targetValue * entryPct) / 100);
  const donorTotal = donors.filter((d) => d.status === 'joined').reduce((s, d) => s + d.amount, 0);
  const tradingGains = 11250;
  const currentPot = lumpSum + donorTotal + tradingGains;
  const donorRaisedCeiling = Math.round(donorTotal * 1.4); // donor contributions raise the ceiling proportionally
  const effectiveTarget = targetValue + donorRaisedCeiling;
  const progressPct = Math.min(100, Math.round((currentPot / effectiveTarget) * 100));

  const drawdownCapPct = 10;
  const drawdownCap = Math.round(lumpSum * (drawdownCapPct / 100));
  const [drawnDown, setDrawnDown] = useState(2000);
  const drawdownLocked = true; // time-lock active in this mock

  const handleInviteDonor = () => {
    if (!inviteName.trim()) return;
    setDonors((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: inviteName.trim(),
        amount: Number(inviteAmount) || 0,
        interestRate: 3.5,
        status: 'invited',
      },
    ]);
    setInviteName('');
    setInviteAmount('');
  };

  return (
    <div className="space-y-8">
      {/* Disclaimer banner */}
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 px-4 py-3 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="text-violet-300 font-medium">Simulation mode.</span> ValorEvest is in pre-launch — figures
          below are illustrative and no real funds, donors, or trades exist yet. Live trading requires FCA / DFPI /
          NYDFS BitLicense authorisation.
        </p>
      </div>

      {/* Hero / target status */}
      <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card/50 to-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                ValorEvest Fund
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">Accumulating</Badge>
              </CardTitle>
              <CardDescription>Your property's path to a funded sale</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatGBP(currentPot)}</div>
              <p className="text-xs text-muted-foreground">of {formatGBP(effectiveTarget)} target</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progressPct} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progressPct}% funded</span>
            <span>Activates automatically at 100%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Risk cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskPct}%</div>
            <p className="text-xs text-muted-foreground mt-1">Locked in smart contract — AI cannot exceed this</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> Trading gains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">+{formatGBP(tradingGains)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ring-fenced — not available for drawdown</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Users className="w-4 h-4" /> Donors joined
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {donors.filter((d) => d.status === 'joined').length}
              <span className="text-base text-muted-foreground">/5</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">+{formatGBP(donorRaisedCeiling)} ceiling raised</p>
          </CardContent>
        </Card>
      </div>

      {/* Entry setup */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Entry Terms</CardTitle>
          <CardDescription>Locked into the smart contract at fund creation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Target property value</Label>
              <span className="font-semibold">{formatGBP(targetValue)}</span>
            </div>
            <Slider
              value={[targetValue]}
              min={150000}
              max={1000000}
              step={5000}
              onValueChange={([v]) => setTargetValue(v)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Maximum risk percentage</Label>
              <span className="font-semibold">{riskPct}%</span>
            </div>
            <Slider value={[riskPct]} min={5} max={30} step={1} onValueChange={([v]) => setRiskPct(v)} />
            <p className="text-xs text-muted-foreground">Enforced on-chain — the AI trading engine cannot exceed this cap.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Initial lump sum entry point</Label>
            <div className="flex gap-2">
              {ENTRY_POINTS.map((pct) => (
                <Button
                  key={pct}
                  size="sm"
                  variant={entryPct === pct ? 'default' : 'outline'}
                  className={entryPct === pct ? 'bg-violet-600 hover:bg-violet-700' : ''}
                  onClick={() => setEntryPct(pct)}
                >
                  {pct}% — {formatGBP(Math.round((targetValue * pct) / 100))}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donors */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Trusted Donors</CardTitle>
              <CardDescription>Up to 5 invited contributors at a pre-agreed interest rate</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700" disabled={donors.length >= 5}>
                  Invite donor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a donor</DialogTitle>
                  <DialogDescription>
                    They'll receive a private invite code. Interest accrues at 3.5% and is fully ring-fenced.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="donor-name">Name</Label>
                    <Input id="donor-name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="e.g. Uncle James" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="donor-amount">Proposed contribution (£)</Label>
                    <Input
                      id="donor-amount"
                      type="number"
                      value={inviteAmount}
                      onChange={(e) => setInviteAmount(e.target.value)}
                      placeholder="10000"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleInviteDonor} className="bg-violet-600 hover:bg-violet-700">
                    Send invite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {donors.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div>
                <p className="font-medium text-sm">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.interestRate}% interest · ring-fenced</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatGBP(d.amount)}</p>
                <Badge
                  variant="outline"
                  className={
                    d.status === 'joined'
                      ? 'border-green-500/30 text-green-400 bg-green-500/10'
                      : 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                  }
                >
                  {d.status === 'joined' ? 'Joined' : 'Invited'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI trading + drawdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-400" /> AI Trading Engine
            </CardTitle>
            <CardDescription>Regulated crypto platform · capped at {riskPct}% risk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Principal pot</span>
              <span className="font-semibold">{formatGBP(lumpSum + donorTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profit (ring-fenced)</span>
              <span className="font-semibold text-green-400">+{formatGBP(tradingGains)}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              FCA-regulated venue · risk cap enforced by smart contract
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowDownToLine className="w-4 h-4 text-violet-400" /> Drawdown
            </CardTitle>
            <CardDescription>Up to {drawdownCapPct}% of principal · time-locked</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Drawn down</span>
              <span className="font-semibold">{formatGBP(drawnDown)} / {formatGBP(drawdownCap)}</span>
            </div>
            <Progress value={(drawnDown / drawdownCap) * 100} className="h-2" />
            {drawdownLocked ? (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <Lock className="w-3.5 h-3.5" />
                Next withdrawal unlocks in 18 days (time-lock)
              </div>
            ) : (
              <Button size="sm" className="w-full bg-violet-600 hover:bg-violet-700">
                Request drawdown
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sale activation */}
      <Card className={`border-border/50 bg-card/50 backdrop-blur-sm ${progressPct >= 100 ? 'border-green-500/40' : ''}`}>
        <CardHeader>
          <CardTitle className="text-lg">Sale Activation</CardTitle>
          <CardDescription>
            {progressPct >= 100
              ? 'Target reached — you can now activate the legal sale.'
              : 'Unlocks automatically once the fund reaches 100% of target.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled={progressPct < 100} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40">
            {progressPct >= 100 ? 'Activate sale' : `Activate sale (${progressPct}% funded)`}
          </Button>
          <div className="flex items-start gap-2 mt-3 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            If the transaction falls through after activation, all funds revert to donors and seller in full (with
            interest), minus a 25% platform fee on profits.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
