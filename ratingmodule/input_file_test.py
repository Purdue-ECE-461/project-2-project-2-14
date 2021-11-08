from input_file import InputFile


def test_getUrls():
    input = InputFile()
    input.getUrls('./urls.txt')
    assert input.urls != None
    assert len(input.urls) == 5
