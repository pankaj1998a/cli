import { type Subprocess } from 'bun';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

interface ManagedProcess {
    pid: number;
    command: string;
    logFile: string;
    process: Subprocess;
}

class ProcessManager {
    private processes: Map<number, ManagedProcess> = new Map();
    private nextId = 1;

    async start(command: string): Promise<{ id: number; message: string }> {
        const id = this.nextId++;
        const logDir = path.join(os.tmpdir(), 'xcode-logs');
        await fs.mkdir(logDir, { recursive: true });
        const logFile = path.join(logDir, `process-${id}.log`);

        const proc = Bun.spawn(command.split(' '), {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: true, // Allow the child process to run independently
        });

        // Pipe stdout and stderr to the log file
        const logStream = fs.createWriteStream(logFile);
        proc.stdout.pipe(logStream);
        proc.stderr.pipe(logStream);

        if (!proc.pid) {
            throw new Error("Failed to get PID for the spawned process.");
        }

        this.processes.set(id, {
            pid: proc.pid,
            command,
            logFile,
            process: proc,
        });

        return { id, message: `Process started with ID ${id} and PID ${proc.pid}. Output is being logged to ${logFile}` };
    }

    async checkStatus(id: number): Promise<string> {
        const managedProcess = this.processes.get(id);
        if (!managedProcess) {
            return `Error: No process found with ID ${id}.`;
        }

        try {
            // Check if the process exists
            process.kill(managedProcess.pid, 0);
            const logContent = await fs.readFile(managedProcess.logFile, 'utf-8');
            return `Process ${id} (PID ${managedProcess.pid}) is running.\n\nLog output:\n${logContent}`;
        } catch (error) {
            // If kill throws an error, the process does not exist
            this.processes.delete(id);
            return `Process ${id} (PID ${managedProcess.pid}) is not running.`;
        }
    }

    stop(id: number): string {
        const managedProcess = this.processes.get(id);
        if (!managedProcess) {
            return `Error: No process found with ID ${id}.`;
        }

        try {
            process.kill(managedProcess.pid, 'SIGTERM');
            this.processes.delete(id);
            return `Process ${id} (PID ${managedProcess.pid}) stopped.`;
        } catch (error) {
            // Process may have already exited
            this.processes.delete(id);
            return `Error stopping process ${id}: ${error.message}. It may have already exited.`;
        }
    }
}

// Export a singleton instance
export const processManager = new ProcessManager();