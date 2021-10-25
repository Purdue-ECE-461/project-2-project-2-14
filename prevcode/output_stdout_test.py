from output_stdout import OutputStdOut
from repo import Repo


def test_display():
    output = OutputStdOut()
    repo = Repo()
    repo.id = 'expressjs/express'
    output.display(repo)
